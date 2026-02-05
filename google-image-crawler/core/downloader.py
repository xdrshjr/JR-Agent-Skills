"""
Google图片下载模块
支持单张下载、批量下载、并发、重试、进度显示
"""
import os
import time
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Callable, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, unquote

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from tqdm import tqdm

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('downloader.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


class ImageDownloader:
    """图片下载器类，支持单张和批量下载"""
    
    # 默认请求头
    DEFAULT_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
    }
    
    def __init__(
        self,
        output_dir: str = "./downloads",
        timeout: int = 30,
        max_retries: int = 3,
        concurrent: int = 5,
        headers: Optional[Dict[str, str]] = None
    ):
        """
        初始化下载器
        
        Args:
            output_dir: 输出目录
            timeout: 请求超时时间（秒）
            max_retries: 最大重试次数
            concurrent: 并发下载数
            headers: 自定义请求头
        """
        self.output_dir = Path(output_dir)
        self.timeout = timeout
        self.max_retries = max_retries
        self.concurrent = concurrent
        self.headers = headers or self.DEFAULT_HEADERS.copy()
        
        # 创建输出目录
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化会话
        self.session = self._create_session()
        
        # 下载统计
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0
        }
        
        logger.info(f"初始化下载器: 输出目录={output_dir}, 并发={concurrent}, 超时={timeout}s")
    
    def _create_session(self) -> requests.Session:
        """创建配置好的requests会话"""
        session = requests.Session()
        session.headers.update(self.headers)
        
        # 配置重试策略
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1,  # 指数退避: 1, 2, 4, 8...
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=self.concurrent,
            pool_maxsize=self.concurrent * 2
        )
        
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _get_filename_from_url(self, url: str, content_type: str = None) -> str:
        """
        从URL生成文件名
        
        Args:
            url: 图片URL
            content_type: HTTP Content-Type
            
        Returns:
            文件名
        """
        # 尝试从URL提取文件名
        parsed = urlparse(url)
        path = unquote(parsed.path)
        
        if path and '.' in path:
            # 提取扩展名
            ext = Path(path).suffix.lower()
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']:
                # 使用哈希值作为文件名，避免冲突
                name_hash = hashlib.md5(url.encode()).hexdigest()[:12]
                return f"{name_hash}{ext}"
        
        # 根据content_type推断扩展名
        ext_map = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/bmp': '.bmp',
            'image/svg+xml': '.svg'
        }
        
        ext = '.jpg'  # 默认扩展名
        if content_type:
            for mime, extension in ext_map.items():
                if mime in content_type:
                    ext = extension
                    break
        
        name_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        return f"{name_hash}{ext}"
    
    def download_single(
        self,
        url: str,
        filename: Optional[str] = None,
        subfolder: Optional[str] = None,
        callback: Optional[Callable] = None
    ) -> Tuple[bool, str]:
        """
        下载单张图片
        
        Args:
            url: 图片URL
            filename: 指定文件名（可选）
            subfolder: 子文件夹（可选）
            callback: 下载完成回调函数
            
        Returns:
            (成功标志, 文件路径或错误信息)
        """
        if not url or not url.startswith(('http://', 'https://')):
            logger.error(f"无效的URL: {url}")
            return False, "Invalid URL"
        
        # 确定保存路径
        save_dir = self.output_dir
        if subfolder:
            save_dir = self.output_dir / subfolder
            save_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            logger.debug(f"开始下载: {url}")
            
            # 发送请求
            response = self.session.get(
                url,
                timeout=self.timeout,
                stream=True,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # 获取文件大小
            total_size = int(response.headers.get('content-length', 0))
            content_type = response.headers.get('content-type', '')
            
            # 检查是否为图片
            if not content_type.startswith('image/'):
                # 某些CDN可能不返回正确的content-type，继续下载
                logger.warning(f"Content-Type不是图片: {content_type}, URL: {url}")
            
            # 确定文件名
            if not filename:
                filename = self._get_filename_from_url(url, content_type)
            
            file_path = save_dir / filename
            
            # 检查文件是否已存在
            if file_path.exists():
                logger.info(f"文件已存在，跳过: {file_path}")
                self.stats['skipped'] += 1
                if callback:
                    callback(url, str(file_path), True)
                return True, str(file_path)
            
            # 下载文件
            downloaded_size = 0
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
            
            # 验证下载
            if total_size > 0 and downloaded_size != total_size:
                file_path.unlink(missing_ok=True)
                raise IOError(f"下载不完整: {downloaded_size}/{total_size} bytes")
            
            file_size = file_path.stat().st_size
            logger.info(f"下载成功: {file_path} ({file_size / 1024:.1f} KB)")
            
            self.stats['success'] += 1
            
            if callback:
                callback(url, str(file_path), True)
            
            return True, str(file_path)
            
        except requests.exceptions.Timeout:
            error_msg = f"下载超时: {url}"
            logger.error(error_msg)
            self.stats['failed'] += 1
            if callback:
                callback(url, error_msg, False)
            return False, error_msg
            
        except requests.exceptions.RequestException as e:
            error_msg = f"下载失败: {url} - {str(e)}"
            logger.error(error_msg)
            self.stats['failed'] += 1
            if callback:
                callback(url, error_msg, False)
            return False, error_msg
            
        except Exception as e:
            error_msg = f"下载异常: {url} - {str(e)}"
            logger.error(error_msg)
            self.stats['failed'] += 1
            if callback:
                callback(url, error_msg, False)
            return False, error_msg
    
    def download_batch(
        self,
        urls: List[str],
        subfolder: Optional[str] = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict[str, any]:
        """
        批量下载图片（并发）
        
        Args:
            urls: 图片URL列表
            subfolder: 子文件夹
            progress_callback: 进度回调函数(当前, 总数)
            
        Returns:
            下载结果统计
        """
        if not urls:
            logger.warning("URL列表为空")
            return {'success': [], 'failed': []}
        
        self.stats['total'] = len(urls)
        results = {
            'success': [],
            'failed': [],
            'skipped': []
        }
        
        logger.info(f"开始批量下载: {len(urls)}张图片, 并发数={self.concurrent}")
        
        with tqdm(total=len(urls), desc="下载进度", unit="张") as pbar:
            with ThreadPoolExecutor(max_workers=self.concurrent) as executor:
                # 提交所有任务
                future_to_url = {
                    executor.submit(
                        self.download_single,
                        url,
                        None,
                        subfolder
                    ): url for url in urls
                }
                
                # 处理完成的任务
                for future in as_completed(future_to_url):
                    url = future_to_url[future]
                    try:
                        success, result = future.result()
                        if success:
                            if "跳过" in result or results.get('skipped'):
                                results['success'].append({'url': url, 'path': result})
                            else:
                                results['success'].append({'url': url, 'path': result})
                        else:
                            results['failed'].append({'url': url, 'error': result})
                    except Exception as e:
                        logger.error(f"任务异常: {url} - {e}")
                        results['failed'].append({'url': url, 'error': str(e)})
                    
                    pbar.update(1)
                    if progress_callback:
                        progress_callback(pbar.n, len(urls))
        
        # 输出统计
        success_count = len(results['success'])
        failed_count = len(results['failed'])
        logger.info(f"批量下载完成: 成功={success_count}, 失败={failed_count}")
        
        return results
    
    def download_with_metadata(
        self,
        items: List[Dict],
        subfolder: Optional[str] = None
    ) -> Dict[str, any]:
        """
        带元数据下载（支持自定义文件名）
        
        Args:
            items: 包含url和metadata的字典列表
                [{"url": "...", "filename": "...", "metadata": {...}}, ...]
            subfolder: 子文件夹
            
        Returns:
            下载结果
        """
        if not items:
            return {'success': [], 'failed': []}
        
        results = {'success': [], 'failed': []}
        
        with tqdm(total=len(items), desc="下载进度", unit="张") as pbar:
            with ThreadPoolExecutor(max_workers=self.concurrent) as executor:
                future_to_item = {}
                
                for item in items:
                    url = item.get('url')
                    filename = item.get('filename')
                    if url:
                        future = executor.submit(
                            self.download_single,
                            url,
                            filename,
                            subfolder
                        )
                        future_to_item[future] = item
                
                for future in as_completed(future_to_item):
                    item = future_to_item[future]
                    url = item.get('url')
                    try:
                        success, result = future.result()
                        if success:
                            results['success'].append({
                                'url': url,
                                'path': result,
                                'metadata': item.get('metadata', {})
                            })
                        else:
                            results['failed'].append({
                                'url': url,
                                'error': result,
                                'metadata': item.get('metadata', {})
                            })
                    except Exception as e:
                        results['failed'].append({
                            'url': url,
                            'error': str(e),
                            'metadata': item.get('metadata', {})
                        })
                    
                    pbar.update(1)
        
        return results
    
    def close(self):
        """关闭会话，释放资源"""
        if self.session:
            self.session.close()
            logger.info("下载器会话已关闭")
    
    def __enter__(self):
        """上下文管理器入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close()
        return False


def download_from_list(
    urls: List[str],
    output_dir: str = "./downloads",
    concurrent: int = 5,
    timeout: int = 30
) -> Dict[str, any]:
    """
    便捷函数：从URL列表下载图片
    
    Args:
        urls: 图片URL列表
        output_dir: 输出目录
        concurrent: 并发数
        timeout: 超时时间
        
    Returns:
        下载结果
    """
    with ImageDownloader(
        output_dir=output_dir,
        concurrent=concurrent,
        timeout=timeout
    ) as downloader:
        return downloader.download_batch(urls)


if __name__ == "__main__":
    # 测试代码
    test_urls = [
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
    ]
    
    print("测试单张下载...")
    with ImageDownloader(output_dir="./test_downloads") as downloader:
        success, path = downloader.download_single(test_urls[0])
        print(f"结果: {success}, 路径: {path}")
        print(f"统计: {downloader.stats}")
