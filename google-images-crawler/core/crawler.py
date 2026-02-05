"""
Google 高清图片爬虫模块
使用 Playwright 实现自动化爬取 Google 图片搜索的原图 URL

Author: Core Developer
Date: 2025-02-06
"""

import logging
logger = logging.getLogger(__name__)

import asyncio
import re
import time
from typing import List, Optional, Set, Dict, Any
from dataclasses import dataclass
from urllib.parse import urlparse, parse_qs, unquote, quote
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser, BrowserContext


@dataclass
class ImageResult:
    """图片结果数据类"""
    url: str                    # 原始高清图片 URL
    thumbnail_url: str          # 缩略图 URL
    title: str                  # 图片标题
    source_url: str             # 来源网页 URL
    width: Optional[int] = None
    height: Optional[int] = None


class GoogleImageCrawler:
    """
    Google 图片爬虫类
    
    使用 Playwright 自动化 Google 图片搜索，提取原始高清图片 URL
    
    Features:
        - 支持关键词搜索
        - 自动滚动加载更多图片
        - 从 imgurl 参数提取原图 URL
        - URL 去重和过滤
        - 错误处理和重试机制
    """
    
    # Google 图片搜索 URL 模板
    GOOGLE_IMAGE_URL = "https://www.google.com/search"
    
    # 默认配置
    DEFAULT_TIMEOUT = 30
    DEFAULT_SCROLL_PAUSE = 1.5
    DEFAULT_MAX_RETRIES = 3
    
    def __init__(
        self,
        headless: bool = True,
        timeout: int = DEFAULT_TIMEOUT,
        scroll_pause: float = DEFAULT_SCROLL_PAUSE,
        max_retries: int = DEFAULT_MAX_RETRIES,
        proxy: Optional[str] = None
    ):
        """
        初始化爬虫
        
        Args:
            headless: 是否无头模式运行浏览器
            timeout: 页面加载超时时间（秒）
            scroll_pause: 每次滚动后的暂停时间（秒）
            max_retries: 最大重试次数
            proxy: 代理服务器地址 (e.g., "http://proxy:8080")
        """
        self.headless = headless
        self.timeout = timeout
        self.scroll_pause = scroll_pause
        self.max_retries = max_retries
        self.proxy = proxy
        
        # 运行时状态
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None
        self._playwright = None
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self._init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self.close()
    
    async def _init_browser(self) -> None:
        """初始化 Playwright 浏览器"""
        self._playwright = await async_playwright().start()
        
        browser_args = {
            "headless": self.headless,
        }
        
        if self.proxy:
            browser_args["proxy"] = {"server": self.proxy}
        
        self._browser = await self._playwright.chromium.launch(**browser_args)
        
        # 创建浏览器上下文，模拟正常用户
        self._context = await self._browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        self._page = await self._context.new_page()
        self._page.set_default_timeout(self.timeout * 1000)
        
        # 处理可能的弹窗和 Cookie 同意
        await self._handle_consent()
    
    async def _handle_consent(self) -> None:
        """处理 Google 的 Cookie 同意弹窗"""
        try:
            # 尝试点击 "Accept all" 或 "I agree"
            consent_button_selectors = [
                'button:has-text("Accept all")',
                'button:has-text("I agree")',
                '[aria-label="Accept all"]',
                'button[aria-label*="Accept"]',
            ]
            
            for selector in consent_button_selectors:
                try:
                    button = await self._page.wait_for_selector(selector, timeout=3000)
                    if button:
                        await button.click()
                        await asyncio.sleep(0.5)
                        break
                except:
                    continue
        except Exception:
            # 没有弹窗或处理失败，继续执行
            pass
    
    async def search(
        self,
        keyword: str,
        num_images: int = 10,
        safe_search: bool = True,
        min_width: Optional[int] = None,
        min_height: Optional[int] = None
    ) -> List[ImageResult]:
        """
        执行图片搜索
        
        Args:
            keyword: 搜索关键词
            num_images: 需要获取的图片数量
            safe_search: 是否开启安全搜索
            min_width: 图片最小宽度过滤
            min_height: 图片最小高度过滤
            
        Returns:
            List[ImageResult]: 图片结果列表
            
        Raises:
            RuntimeError: 浏览器未初始化
            Exception: 搜索过程中发生错误
        """
        if not self._page:
            await self._init_browser()
        
        results: List[ImageResult] = []
        seen_urls: Set[str] = set()
        
        for attempt in range(self.max_retries):
            try:
                # 构建搜索 URL
                search_url = self._build_search_url(keyword, safe_search)
                
                # 访问搜索页面
                await self._page.goto(search_url, wait_until="networkidle")
                await self._handle_consent()
                
                # 等待图片加载
                await self._page.wait_for_selector("img", timeout=10000)
                
                # 滚动页面加载更多图片
                image_urls = await self._scroll_and_extract(
                    target_count=num_images,
                    min_width=min_width,
                    min_height=min_height
                )
                
                # 解析并过滤 URL
                for item in image_urls:
                    original_url = item.get("original_url", "")
                    
                    # 去重检查
                    if original_url and original_url not in seen_urls:
                        seen_urls.add(original_url)
                        
                        result = ImageResult(
                            url=original_url,
                            thumbnail_url=item.get("thumbnail_url", ""),
                            title=item.get("title", ""),
                            source_url=item.get("source_url", ""),
                            width=item.get("width"),
                            height=item.get("height")
                        )
                        results.append(result)
                        
                        if len(results) >= num_images:
                            break
                
                if len(results) >= num_images:
                    break
                    
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise Exception(f"搜索失败，已重试 {self.max_retries} 次: {str(e)}")
                await asyncio.sleep(2 ** attempt)  # 指数退避
                continue
        
        return results[:num_images]
    
    def _build_search_url(self, keyword: str, safe_search: bool = True) -> str:
        """
        构建 Google 图片搜索 URL
        
        Args:
            keyword: 搜索关键词
            safe_search: 是否开启安全搜索
            
        Returns:
            str: 完整的搜索 URL
        """
        # URL 编码关键词
        encoded_keyword = quote(keyword)
        
        # 基础参数
        params = f"q={encoded_keyword}&tbm=isch"
        
        # 安全搜索参数
        if safe_search:
            params += "&safe=active"
        
        return f"{self.GOOGLE_IMAGE_URL}?{params}"
    
    async def _scroll_and_extract(
        self,
        target_count: int,
        min_width: Optional[int] = None,
        min_height: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        滚动页面并提取图片 URL
        
        Args:
            target_count: 目标图片数量
            min_width: 最小宽度过滤
            min_height: 最小高度过滤
            
        Returns:
            List[Dict]: 提取的图片信息列表
        """
        results: List[Dict[str, Any]] = []
        last_height = 0
        no_change_count = 0
        max_no_change = 3
        
        while len(results) < target_count and no_change_count < max_no_change:
            # 提取当前页面的图片
            new_results = await self._extract_image_urls_from_page()
            
            # 过滤新结果
            for item in new_results:
                # 检查尺寸过滤
                if min_width and item.get("width", 0) < min_width:
                    continue
                if min_height and item.get("height", 0) < min_height:
                    continue
                
                # 检查是否已存在
                if not any(r.get("original_url") == item.get("original_url") for r in results):
                    results.append(item)
            
            # 滚动页面
            await self._page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(self.scroll_pause)
            
            # 检查是否到达底部
            new_height = await self._page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                no_change_count += 1
                
                # 尝试点击 "Show more results" 或 "More results"
                try:
                    more_button = await self._page.wait_for_selector(
                        'input[type="button"][value*="more"], button:has-text("more results")',
                        timeout=2000
                    )
                    if more_button:
                        await more_button.click()
                        await asyncio.sleep(self.scroll_pause)
                        no_change_count = 0
                except:
                    pass
            else:
                no_change_count = 0
                last_height = new_height
        
        return results
    
    async def _extract_image_urls_from_page(self) -> List[Dict[str, Any]]:
        """
        从当前页面提取图片 URL
        
        从 Google 图片搜索结果中提取原始图片 URL（通过 imgurl 参数）
        
        Returns:
            List[Dict]: 图片信息字典列表
        """
        results = []
        
        try:
            # 获取所有图片相关的锚点元素
            anchors = await self._page.query_selector_all('a[href*="/imgres"]')
            
            for anchor in anchors:
                try:
                    href = await anchor.get_attribute("href")
                    if not href:
                        continue
                    
                    # 解析 URL 参数
                    parsed = urlparse(href)
                    query_params = parse_qs(parsed.query)
                    
                    # 提取原始图片 URL（imgurl 参数）
                    original_url = ""
                    if "imgurl" in query_params:
                        original_url = unquote(query_params["imgurl"][0])
                    
                    # 提取来源网页 URL（imgrefurl 参数）
                    source_url = ""
                    if "imgrefurl" in query_params:
                        source_url = unquote(query_params["imgrefurl"][0])
                    
                    # 提取图片尺寸信息
                    width = None
                    height = None
                    if "w" in query_params:
                        try:
                            width = int(query_params["w"][0])
                        except ValueError:
                            pass
                    if "h" in query_params:
                        try:
                            height = int(query_params["h"][0])
                        except ValueError:
                            pass
                    
                    # 获取缩略图 URL
                    thumbnail = await anchor.query_selector("img")
                    thumbnail_url = ""
                    if thumbnail:
                        thumbnail_url = await thumbnail.get_attribute("src") or ""
                    
                    # 获取标题
                    title = ""
                    try:
                        # 尝试从相邻元素获取标题
                        parent = await anchor.evaluate("el => el.closest('div[data-ved]')")
                        if parent:
                            title_elem = await anchor.query_selector('img[alt]')
                            if title_elem:
                                title = await title_elem.get_attribute("alt") or ""
                    except:
                        pass
                    
                    # 过滤无效 URL
                    if original_url and self._is_valid_image_url(original_url):
                        results.append({
                            "original_url": original_url,
                            "thumbnail_url": thumbnail_url,
                            "source_url": source_url,
                            "title": title,
                            "width": width,
                            "height": height
                        })
                        
                except Exception as e:
                    # 单个元素处理失败，继续处理下一个
                    continue
                    
        except Exception as e:
            # 提取过程出错，返回已收集的结果
            pass
        
        return results
    
    def _is_valid_image_url(self, url: str) -> bool:
        """
        检查 URL 是否为有效的图片 URL
        
        Args:
            url: 待检查的 URL
            
        Returns:
            bool: 是否有效
        """
        if not url:
            return False
        
        # 检查协议
        if not (url.startswith("http://") or url.startswith("https://")):
            return False
        
        # 排除 Google 内部链接
        if "google.com" in url or "gstatic.com" in url:
            return False
        
        # 排除数据 URI
        if url.startswith("data:"):
            return False
        
        # 排除常见非图片扩展名
        invalid_extensions = ['.html', '.htm', '.php', '.jsp', '.asp', '.aspx']
        url_lower = url.lower()
        for ext in invalid_extensions:
            if url_lower.endswith(ext):
                return False
        
        return True
    
    async def download_image(
        self,
        image_url: str,
        output_path: str,
        filename: Optional[str] = None
    ) -> str:
        """
        下载单张图片
        
        Args:
            image_url: 图片 URL
            output_path: 输出目录
            filename: 自定义文件名（可选）
            
        Returns:
            str: 保存的文件路径
        """
        try:
            import aiohttp
        except ImportError:
            raise ImportError("下载功能需要 aiohttp，请运行: pip install aiohttp")
        
        # 确保输出目录存在
        output_dir = Path(output_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 生成文件名
        if not filename:
            # 从 URL 提取文件名
            parsed = urlparse(image_url)
            filename = Path(parsed.path).name
            if not filename:
                filename = f"image_{int(time.time())}.jpg"
        
        file_path = output_dir / filename
        
        # 下载图片
        async with aiohttp.ClientSession() as session:
            async with session.get(image_url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                response.raise_for_status()
                content = await response.read()
                
                # 使用标准库写入文件（在异步环境中使用线程池）
                import concurrent.futures
                loop = asyncio.get_event_loop()
                
                def write_file():
                    with open(file_path, 'wb') as f:
                        f.write(content)
                
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    await loop.run_in_executor(pool, write_file)
        
        return str(file_path)
    
    async def download_images(
        self,
        results: List[ImageResult],
        output_dir: str,
        concurrency: int = 3
    ) -> List[str]:
        """
        批量下载图片
        
        Args:
            results: 图片结果列表
            output_dir: 输出目录
            concurrency: 并发下载数
            
        Returns:
            List[str]: 下载成功的文件路径列表
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        downloaded = []
        semaphore = asyncio.Semaphore(concurrency)
        
        async def download_with_limit(result: ImageResult, index: int):
            async with semaphore:
                try:
                    # 生成序号文件名
                    ext = Path(result.url).suffix or ".jpg"
                    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']:
                        ext = ".jpg"
                    filename = f"{index:04d}{ext}"
                    
                    file_path = await self.download_image(
                        result.url,
                        str(output_path),
                        filename
                    )
                    downloaded.append(file_path)
                    return file_path
                except Exception as e:
                    print(f"下载失败 {result.url}: {str(e)}")
                    return None
        
        # 并发下载
        tasks = [
            download_with_limit(result, i)
            for i, result in enumerate(results)
        ]
        await asyncio.gather(*tasks)
        
        return [p for p in downloaded if p]
    
    async def close(self) -> None:
        """关闭浏览器，释放资源"""
        if self._context:
            await self._context.close()
            self._context = None
        
        if self._browser:
            await self._browser.close()
            self._browser = None
        
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        
        self._page = None


# 便捷函数
async def search_images(
    keyword: str,
    num_images: int = 10,
    **kwargs
) -> List[ImageResult]:
    """
    便捷函数：快速搜索图片
    
    Args:
        keyword: 搜索关键词
        num_images: 图片数量
        **kwargs: 传递给 GoogleImageCrawler 的其他参数
        
    Returns:
        List[ImageResult]: 图片结果列表
        
    Example:
        >>> results = await search_images("cat", num_images=5)
        >>> for r in results:
        ...     print(r.url)
    """
    async with GoogleImageCrawler(**kwargs) as crawler:
        return await crawler.search(keyword, num_images)


# 同步包装函数
def search_images_sync(
    keyword: str,
    num_images: int = 10,
    **kwargs
) -> List[ImageResult]:
    """
    同步版本的图片搜索函数
    
    Args:
        keyword: 搜索关键词
        num_images: 图片数量
        **kwargs: 传递给 GoogleImageCrawler 的其他参数
        
    Returns:
        List[ImageResult]: 图片结果列表
    """
    return asyncio.run(search_images(keyword, num_images, **kwargs))


if __name__ == "__main__":
    # 测试代码
    async def test():
        print("Testing Google Image Crawler...")
        
        async with GoogleImageCrawler(headless=False) as crawler:
            results = await crawler.search("cute cat", num_images=5)
            
            print(f"\nFound {len(results)} images:")
            for i, result in enumerate(results, 1):
                print(f"\n{i}. {result.title[:50] if result.title else 'No title'}")
                print(f"   URL: {result.url[:80]}...")
                print(f"   Size: {result.width}x{result.height}")
    
    asyncio.run(test())
