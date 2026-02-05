---
name: google-image-crawler
description: |
  基于 Playwright 的 Google 图片爬虫 Skill，支持自动化搜索、提取高清原图 URL 和批量下载。
  
  核心能力：
  - 使用 Playwright 自动化 Google 图片搜索，无需手动操作浏览器
  - 智能提取原始高清图片 URL（通过解析 imgurl 参数）
  - 支持自动滚动加载更多图片，突破单次搜索结果限制
  - URL 去重和过滤（自动排除缩略图和无效链接）
  - 支持图片尺寸过滤（最小宽度/高度）
  - 提供异步和同步两种 API 接口
  - 批量下载支持并发和进度显示
  
  适用场景：
  - 需要批量获取图片素材（设计、训练数据集等）
  - 需要从 Google 图片搜索抓取高清原图
  - 需要自动化图片采集工作流
  
  注意事项：
  - 请遵守 Google 服务条款和网站的 robots.txt
  - 控制请求频率，避免对服务器造成压力
  - 商业使用请确认图片版权合规
  - 建议使用代理避免 IP 限制
---

# Google Image Crawler

基于 Playwright 的 Google 图片爬虫，支持提取高清原图 URL 和批量下载。

## 快速开始

### 安装依赖

```bash
pip install playwright aiohttp requests tqdm
playwright install chromium
```

### 基础使用

```python
import asyncio
from crawler import GoogleImageCrawler

async def main():
    async with GoogleImageCrawler() as crawler:
        # 搜索图片
        results = await crawler.search("cute cats", num_images=10)
        
        # 打印结果
        for result in results:
            print(f"URL: {result.url}")
            print(f"Size: {result.width}x{result.height}")
        
        # 下载图片
        downloaded = await crawler.download_images(
            results,
            output_dir="./downloads"
        )

asyncio.run(main())
```

### 同步 API（快速调用）

```python
from crawler import search_images_sync

# 一行代码搜索图片
results = search_images_sync("mountain landscape", num_images=5)
for r in results:
    print(r.url)
```

## 核心功能

### 1. 图片搜索 (GoogleImageCrawler.search)

使用 Playwright 自动化 Google 图片搜索，提取原始高清图片 URL。

```python
results = await crawler.search(
    keyword="search term",      # 搜索关键词
    num_images=10,              # 获取数量
    safe_search=True,           # 安全搜索
    min_width=None,             # 最小宽度过滤
    min_height=None             # 最小高度过滤
)
```

### 2. 图片下载 (GoogleImageCrawler.download_images)

异步批量下载图片，支持并发控制。

```python
downloaded = await crawler.download_images(
    results=results,            # 搜索结果列表
    output_dir="./images",      # 输出目录
    concurrency=3               # 并发数
)
```

### 3. 独立下载模块 (ImageDownloader)

更强大的下载功能，支持线程池并发和进度显示。

```python
from downloader import ImageDownloader

downloader = ImageDownloader(
    output_dir="./downloads",
    concurrent=5,
    max_retries=3
)

results = downloader.download_batch(urls)
```

### 4. 命令行工具

```bash
# 从文件下载
python cli.py -f urls.txt -o ./images

# 带参数下载
python cli.py -f urls.txt -c 10 -t 60 -o ./images

# 下载单张图片
python cli.py -u "https://example.com/image.jpg" -o ./images
```

## 使用示例

### 示例 1: 基础搜索

```python
import asyncio
from crawler import GoogleImageCrawler

async def basic_search():
    async with GoogleImageCrawler(headless=True) as crawler:
        results = await crawler.search("sunset beach", num_images=5)
        
        print(f"找到 {len(results)} 张图片:")
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.title[:40] if result.title else 'No title'}")
            print(f"   URL: {result.url[:70]}...")
            print(f"   尺寸: {result.width}x{result.height}")

asyncio.run(basic_search())
```

### 示例 2: HD 壁纸搜索（带尺寸过滤）

```python
async def hd_wallpaper_search():
    async with GoogleImageCrawler() as crawler:
        results = await crawler.search(
            "4k wallpaper",
            num_images=5,
            min_width=1920,
            min_height=1080
        )
        
        print(f"找到 {len(results)} 张高清图片:")
        for result in results:
            print(f"✓ {result.width}x{result.height} - {result.url[:60]}...")

asyncio.run(hd_wallpaper_search())
```

### 示例 3: 搜索并下载

```python
async def search_and_download():
    async with GoogleImageCrawler() as crawler:
        # 搜索
        results = await crawler.search("puppy", num_images=10)
        print(f"搜索完成，准备下载 {len(results)} 张图片...")
        
        # 下载
        downloaded = await crawler.download_images(
            results,
            output_dir="./downloads",
            concurrency=2
        )
        print(f"下载成功: {len(downloaded)} 张")
        for path in downloaded:
            print(f"  → {path}")

asyncio.run(search_and_download())
```

### 示例 4: 使用独立下载模块

```python
from downloader import ImageDownloader

# 单独使用下载模块
downloader = ImageDownloader(
    output_dir="./downloads",
    concurrent=5,
    timeout=30,
    max_retries=3
)

# 从 URL 列表下载
urls = [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
]

results = downloader.download_batch(urls)

# 统计结果
success = len(results['success'])
failed = len(results['failed'])
print(f"成功: {success}, 失败: {failed}")
```

### 示例 5: 组合使用（推荐）

```python
import asyncio
from crawler import GoogleImageCrawler
from downloader import ImageDownloader

async def combined_workflow():
    # 1. 爬取图片 URL
    async with GoogleImageCrawler() as crawler:
        results = await crawler.search("mountain", num_images=20)
        urls = [r.url for r in results]
    
    # 2. 使用 Downloader 下载（支持更多功能）
    downloader = ImageDownloader(
        output_dir="./mountain_images",
        concurrent=5,
        max_retries=3
    )
    
    with downloader:
        results = downloader.download_batch(urls)
        
        # 统计结果
        success = len(results['success'])
        failed = len(results['failed'])
        print(f"成功: {success}/{success + failed}")

asyncio.run(combined_workflow())
```

## 参数说明

### GoogleImageCrawler 初始化参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headless` | bool | True | 无头模式（不显示浏览器窗口） |
| `timeout` | int | 30 | 页面加载超时（秒） |
| `scroll_pause` | float | 1.5 | 滚动间隔（秒） |
| `max_retries` | int | 3 | 最大重试次数 |
| `proxy` | str | None | 代理服务器地址 (e.g., "http://proxy:8080") |

### search() 方法参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | str | 必填 | 搜索关键词 |
| `num_images` | int | 10 | 需要获取的图片数量 |
| `safe_search` | bool | True | 是否开启安全搜索 |
| `min_width` | int | None | 图片最小宽度过滤 |
| `min_height` | int | None | 图片最小高度过滤 |

### ImageResult 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `url` | str | 原始高清图片 URL |
| `thumbnail_url` | str | 缩略图 URL |
| `title` | str | 图片标题 |
| `source_url` | str | 来源网页 URL |
| `width` | int | 图片宽度 |
| `height` | int | 图片高度 |

### ImageDownloader 初始化参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `output_dir` | str | "./downloads" | 输出目录 |
| `timeout` | int | 30 | 请求超时（秒） |
| `max_retries` | int | 3 | 最大重试次数 |
| `concurrent` | int | 5 | 并发下载数 |
| `headers` | dict | None | 自定义请求头 |

### CLI 参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `--file` | `-f` | URL 列表文件路径 |
| `--url` | `-u` | 单个图片 URL |
| `--output` | `-o` | 输出目录 |
| `--concurrent` | `-c` | 并发下载数 |
| `--timeout` | `-t` | 超时时间（秒） |
| `--retries` | `-r` | 最大重试次数 |
| `--limit` | `-l` | 限制下载数量 |
| `--proxy` | | 代理服务器地址 |

## 错误处理

### 常见错误及解决方案

#### 1. 浏览器初始化失败

```python
# 错误: BrowserInitError 或 playwright 相关错误
# 解决方案: 确保已安装浏览器

# 运行安装命令
# playwright install chromium
```

#### 2. 搜索超时或页面加载失败

```python
# 错误: TimeoutError 或页面加载失败
# 解决方案: 增加超时时间或使用代理

async with GoogleImageCrawler(timeout=60) as crawler:
    results = await crawler.search("keyword", num_images=10)
```

#### 3. 图片下载失败

```python
# 错误: DownloadError 或 HTTP 错误
# 解决方案: 增加重试次数或使用独立下载模块

downloader = ImageDownloader(max_retries=5, timeout=60)
results = downloader.download_batch(urls)
```

#### 4. IP 被限制

```python
# 错误: 频繁出现连接被拒绝或验证码
# 解决方案: 使用代理和增加滚动间隔

async with GoogleImageCrawler(
    proxy="http://proxy:8080",
    scroll_pause=3.0  # 增加间隔
) as crawler:
    results = await crawler.search("keyword", num_images=10)
```

### 异常处理示例

```python
import asyncio
from crawler import GoogleImageCrawler

async def safe_search():
    try:
        async with GoogleImageCrawler() as crawler:
            results = await crawler.search("keyword", num_images=10)
            return results
    except Exception as e:
        print(f"搜索失败: {e}")
        return []

async def safe_download(crawler, results):
    try:
        downloaded = await crawler.download_images(
            results,
            output_dir="./downloads",
            concurrency=2
        )
        return downloaded
    except Exception as e:
        print(f"下载失败: {e}")
        return []

# 使用
asyncio.run(safe_search())
```

## 技术细节

### 原图 URL 提取原理

Google 图片搜索结果的每个图片都包含一个 `/imgres` 链接：

```
/imgres?imgurl=https://example.com/original.jpg&imgrefurl=...
```

爬虫通过解析 `imgurl` 参数获取原图地址。

### 反爬策略

- 使用正常用户 User-Agent
- 设置合理视口大小（1920x1080）
- 自动处理 Cookie 同意弹窗
- 滚动间隔模拟人工操作（1.5秒）
- 指数退避重试机制

## 文件结构

```
google-image-crawler/
├── crawler.py          # 爬虫核心模块 (Playwright + 异步)
├── downloader.py       # 图片下载模块 (Requests + 线程池)
├── config.py           # 配置管理
├── cli.py              # 命令行工具
├── example.py          # 使用示例
└── docs/               # 文档
    ├── architecture.md # 架构设计
    ├── api-reference.md # API 参考
    └── examples.md     # 更多示例
```

## 依赖

- **playwright**: 浏览器自动化
- **aiohttp**: 异步 HTTP 客户端
- **requests**: 同步 HTTP 请求
- **tqdm**: 进度条显示

## 注意事项

1. **遵守服务条款**: 请遵守 Google 服务条款和目标网站的 robots.txt
2. **控制频率**: 避免过于频繁的请求，建议设置合理的 scroll_pause
3. **版权合规**: 商业使用请确认图片版权
4. **使用代理**: 大量爬取时建议使用代理避免 IP 限制
5. **资源释放**: 使用 `async with` 上下文管理器确保浏览器正确关闭

## License

MIT
