# API 参考文档

本文档详细介绍 Google Image Crawler 的所有 API 接口。

## 目录

- [数据模型](#数据模型)
- [GoogleImageCrawler](#googleimagecrawler)
- [ImageDownloader](#imagedownloader)
- [便捷函数](#便捷函数)
- [配置类](#配置类)

---

## 数据模型

### ImageResult

图片搜索结果数据类。

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ImageResult:
    url: str                    # 原始高清图片 URL
    thumbnail_url: str          # 缩略图 URL
    title: str                  # 图片标题
    source_url: str             # 来源网页 URL
    width: Optional[int] = None # 图片宽度
    height: Optional[int] = None # 图片高度
```

**属性说明:**

| 属性 | 类型 | 说明 |
|------|------|------|
| `url` | str | 原始高清图片的直接 URL |
| `thumbnail_url` | str | Google 生成的缩略图 URL |
| `title` | str | 图片的 alt 文本或标题 |
| `source_url` | str | 图片所在网页的 URL |
| `width` | int \| None | 图片宽度（像素）|
| `height` | int \| None | 图片高度（像素）|

**使用示例:**

```python
from crawler import GoogleImageCrawler

async with GoogleImageCrawler() as crawler:
    results = await crawler.search("cat", num_images=5)
    
    for result in results:
        print(f"URL: {result.url}")
        print(f"尺寸: {result.width}x{result.height}")
        print(f"来源: {result.source_url}")
```

---

## GoogleImageCrawler

核心爬虫类，使用 Playwright 自动化 Google 图片搜索。

### 初始化

```python
class GoogleImageCrawler:
    def __init__(
        self,
        headless: bool = True,
        timeout: int = 30,
        scroll_pause: float = 1.5,
        max_retries: int = 3,
        proxy: Optional[str] = None
    )
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headless` | bool | True | 无头模式（不显示浏览器窗口） |
| `timeout` | int | 30 | 页面加载超时时间（秒） |
| `scroll_pause` | float | 1.5 | 每次滚动后的暂停时间（秒） |
| `max_retries` | int | 3 | 搜索失败时的最大重试次数 |
| `proxy` | str \| None | None | 代理服务器地址，如 "http://proxy:8080" |

**使用示例:**

```python
# 基础初始化
crawler = GoogleImageCrawler()

# 带代理和自定义超时
crawler = GoogleImageCrawler(
    headless=False,           # 显示浏览器窗口（调试用）
    timeout=60,               # 60秒超时
    scroll_pause=2.0,         # 2秒滚动间隔
    max_retries=5,            # 5次重试
    proxy="http://127.0.0.1:8080"
)
```

### 上下文管理器

`GoogleImageCrawler` 支持异步上下文管理器，确保资源正确释放。

```python
# 推荐方式
async with GoogleImageCrawler() as crawler:
    results = await crawler.search("keyword")
    # 浏览器会自动关闭

# 等效于
crawler = GoogleImageCrawler()
await crawler._init_browser()
try:
    results = await crawler.search("keyword")
finally:
    await crawler.close()
```

### search()

执行图片搜索。

```python
async def search(
    self,
    keyword: str,
    num_images: int = 10,
    safe_search: bool = True,
    min_width: Optional[int] = None,
    min_height: Optional[int] = None
) -> List[ImageResult]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | str | 必填 | 搜索关键词 |
| `num_images` | int | 10 | 需要获取的图片数量 |
| `safe_search` | bool | True | 是否开启安全搜索 |
| `min_width` | int \| None | None | 图片最小宽度过滤 |
| `min_height` | int \| None | None | 图片最小高度过滤 |

**返回值:**

`List[ImageResult]` - 图片结果列表

**异常:**

- `RuntimeError`: 浏览器未初始化
- `Exception`: 搜索过程中发生错误（已重试 max_retries 次）

**使用示例:**

```python
async with GoogleImageCrawler() as crawler:
    # 基础搜索
    results = await crawler.search("puppy", num_images=10)
    
    # 带尺寸过滤的搜索
    hd_results = await crawler.search(
        "4k wallpaper",
        num_images=20,
        min_width=1920,
        min_height=1080
    )
```

### download_image()

下载单张图片。

```python
async def download_image(
    self,
    image_url: str,
    output_path: str,
    filename: Optional[str] = None
) -> str
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `image_url` | str | 必填 | 图片 URL |
| `output_path` | str | 必填 | 输出目录 |
| `filename` | str \| None | None | 自定义文件名（可选） |

**返回值:**

`str` - 保存的文件路径

**异常:**

- `ImportError`: 未安装 aiohttp
- `Exception`: 下载失败

**使用示例:**

```python
async with GoogleImageCrawler() as crawler:
    file_path = await crawler.download_image(
        "https://example.com/image.jpg",
        "./downloads",
        "my_image.jpg"
    )
    print(f"已保存: {file_path}")
```

### download_images()

批量下载图片。

```python
async def download_images(
    self,
    results: List[ImageResult],
    output_dir: str,
    concurrency: int = 3
) -> List[str]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `results` | List[ImageResult] | 必填 | 搜索结果列表 |
| `output_dir` | str | 必填 | 输出目录 |
| `concurrency` | int | 3 | 并发下载数 |

**返回值:**

`List[str]` - 下载成功的文件路径列表

**使用示例:**

```python
async with GoogleImageCrawler() as crawler:
    results = await crawler.search("cat", num_images=10)
    
    downloaded = await crawler.download_images(
        results,
        output_dir="./downloads",
        concurrency=3
    )
    
    print(f"成功下载 {len(downloaded)} 张图片")
```

### close()

关闭浏览器，释放资源。

```python
async def close(self) -> None
```

**说明:**

通常在上下文管理器中自动调用，如需手动控制可显式调用。

**使用示例:**

```python
crawler = GoogleImageCrawler()
await crawler._init_browser()

# 执行操作
results = await crawler.search("keyword")

# 手动关闭
await crawler.close()
```

---

## ImageDownloader

独立图片下载模块，支持更强大的下载功能。

### 初始化

```python
class ImageDownloader:
    def __init__(
        self,
        output_dir: str = "./downloads",
        timeout: int = 30,
        max_retries: int = 3,
        concurrent: int = 5,
        headers: Optional[Dict[str, str]] = None
    )
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `output_dir` | str | "./downloads" | 输出目录 |
| `timeout` | int | 30 | 请求超时时间（秒） |
| `max_retries` | int | 3 | 最大重试次数 |
| `concurrent` | int | 5 | 并发下载数 |
| `headers` | dict \| None | None | 自定义请求头 |

**使用示例:**

```python
from downloader import ImageDownloader

downloader = ImageDownloader(
    output_dir="./my_images",
    timeout=60,
    max_retries=5,
    concurrent=10
)
```

### 上下文管理器

```python
# 推荐方式
with ImageDownloader() as downloader:
    results = downloader.download_batch(urls)
    # 会话会自动关闭
```

### download_single()

下载单张图片。

```python
def download_single(
    self,
    url: str,
    filename: Optional[str] = None,
    subfolder: Optional[str] = None,
    callback: Optional[Callable] = None
) -> Tuple[bool, str]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | str | 必填 | 图片 URL |
| `filename` | str \| None | None | 指定文件名 |
| `subfolder` | str \| None | None | 子文件夹 |
| `callback` | Callable \| None | None | 下载完成回调函数 |

**返回值:**

`Tuple[bool, str]` - (成功标志, 文件路径或错误信息)

**使用示例:**

```python
downloader = ImageDownloader(output_dir="./downloads")

success, result = downloader.download_single(
    "https://example.com/image.jpg",
    filename="custom_name.jpg",
    subfolder="category1"
)

if success:
    print(f"下载成功: {result}")
else:
    print(f"下载失败: {result}")
```

### download_batch()

批量下载图片。

```python
def download_batch(
    self,
    urls: List[str],
    subfolder: Optional[str] = None,
    progress_callback: Optional[Callable] = None
) -> Dict[str, any]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `urls` | List[str] | 必填 | 图片 URL 列表 |
| `subfolder` | str \| None | None | 子文件夹 |
| `progress_callback` | Callable \| None | None | 进度回调函数 `(current, total)` |

**返回值:**

```python
{
    'success': [
        {'url': str, 'path': str},
        ...
    ],
    'failed': [
        {'url': str, 'error': str},
        ...
    ]
}
```

**使用示例:**

```python
urls = [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
    "https://example.com/3.jpg"
]

def on_progress(current, total):
    print(f"进度: {current}/{total}")

with ImageDownloader(concurrent=5) as downloader:
    results = downloader.download_batch(
        urls,
        subfolder="images",
        progress_callback=on_progress
    )
    
    print(f"成功: {len(results['success'])}")
    print(f"失败: {len(results['failed'])}")
```

### download_with_metadata()

带元数据下载，支持自定义文件名。

```python
def download_with_metadata(
    self,
    items: List[Dict],
    subfolder: Optional[str] = None
) -> Dict[str, any]
```

**参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `items` | List[Dict] | 包含 url 和 metadata 的字典列表 |
| `subfolder` | str \| None | 子文件夹 |

**items 格式:**

```python
[
    {
        "url": "https://example.com/image.jpg",
        "filename": "custom_name.jpg",  # 可选
        "metadata": {...}  # 可选，会保留在结果中
    },
    ...
]
```

**使用示例:**

```python
items = [
    {
        "url": "https://example.com/cat.jpg",
        "filename": "cat_001.jpg",
        "metadata": {"category": "animals", "tag": "cat"}
    },
    {
        "url": "https://example.com/dog.jpg",
        "filename": "dog_001.jpg",
        "metadata": {"category": "animals", "tag": "dog"}
    }
]

with ImageDownloader() as downloader:
    results = downloader.download_with_metadata(items)
    
    for item in results['success']:
        print(f"路径: {item['path']}")
        print(f"元数据: {item['metadata']}")
```

### close()

关闭会话，释放资源。

```python
def close(self) -> None
```

**使用示例:**

```python
downloader = ImageDownloader()
# 使用 downloader...
downloader.close()
```

---

## 便捷函数

### search_images()

快速搜索图片的异步便捷函数。

```python
async def search_images(
    keyword: str,
    num_images: int = 10,
    **kwargs
) -> List[ImageResult]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | str | 必填 | 搜索关键词 |
| `num_images` | int | 10 | 图片数量 |
| `**kwargs` | | | 传递给 GoogleImageCrawler 的其他参数 |

**返回值:**

`List[ImageResult]` - 图片结果列表

**使用示例:**

```python
import asyncio
from crawler import search_images

async def main():
    results = await search_images("cat", num_images=5)
    for r in results:
        print(r.url)

asyncio.run(main())
```

### search_images_sync()

快速搜索图片的同步便捷函数。

```python
def search_images_sync(
    keyword: str,
    num_images: int = 10,
    **kwargs
) -> List[ImageResult]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | str | 必填 | 搜索关键词 |
| `num_images` | int | 10 | 图片数量 |
| `**kwargs` | | | 传递给 GoogleImageCrawler 的其他参数 |

**返回值:**

`List[ImageResult]` - 图片结果列表

**使用示例:**

```python
from crawler import search_images_sync

# 无需 async/await
results = search_images_sync("cat", num_images=5)
for r in results:
    print(r.url)
```

### download_from_list()

从 URL 列表下载图片的便捷函数。

```python
def download_from_list(
    urls: List[str],
    output_dir: str = "./downloads",
    concurrent: int = 5,
    timeout: int = 30
) -> Dict[str, any]
```

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `urls` | List[str] | 必填 | 图片 URL 列表 |
| `output_dir` | str | "./downloads" | 输出目录 |
| `concurrent` | int | 5 | 并发数 |
| `timeout` | int | 30 | 超时时间（秒） |

**返回值:**

`Dict[str, any]` - 下载结果统计

**使用示例:**

```python
from downloader import download_from_list

urls = ["https://example.com/1.jpg", "https://example.com/2.jpg"]
results = download_from_list(urls, output_dir="./downloads", concurrent=3)

print(f"成功: {len(results['success'])}")
print(f"失败: {len(results['failed'])}")
```

---

## 配置类

### DownloadConfig

下载配置数据类。

```python
from dataclasses import dataclass, field

@dataclass
class DownloadConfig:
    # 输出设置
    output_dir: str = "./downloads"
    create_keyword_subdir: bool = True
    
    # 下载设置
    timeout: int = 30
    max_retries: int = 3
    concurrent: int = 5
    chunk_size: int = 8192
    
    # 网络设置
    user_agent: str = "Mozilla/5.0 (...)"
    referer: str = "https://www.google.com/"
    proxy: Optional[str] = None
    
    # 文件设置
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    min_file_size: int = 1024  # 1KB
    allowed_extensions: list = field(default_factory=lambda: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])
    
    # 日志设置
    log_level: str = "INFO"
    log_file: str = "downloader.log"
    save_failed_urls: bool = True
    
    # Google图片搜索设置
    google_domain: str = "www.google.com"
    safe_search: bool = True
    image_size: str = "large"
```

**类方法:**

| 方法 | 说明 |
|------|------|
| `from_file(filepath)` | 从 JSON 文件加载配置 |
| `from_env()` | 从环境变量加载配置 |
| `to_file(filepath)` | 保存配置到 JSON 文件 |
| `get_headers()` | 获取请求头字典 |
| `get_output_path(keyword)` | 获取输出路径 |

**使用示例:**

```python
from config import DownloadConfig

# 从文件加载
config = DownloadConfig.from_file("config.json")

# 从环境变量加载
config = DownloadConfig.from_env()

# 创建自定义配置
config = DownloadConfig(
    output_dir="./my_downloads",
    timeout=60,
    concurrent=10
)

# 保存配置
config.to_file("my_config.json")

# 获取请求头
headers = config.get_headers()
```

### 环境变量映射

| 环境变量 | 配置属性 |
|----------|----------|
| `DL_OUTPUT_DIR` | `output_dir` |
| `DL_TIMEOUT` | `timeout` |
| `DL_MAX_RETRIES` | `max_retries` |
| `DL_CONCURRENT` | `concurrent` |
| `DL_USER_AGENT` | `user_agent` |
| `DL_PROXY` | `proxy` |
| `DL_LOG_LEVEL` | `log_level` |

---

## 类型提示速查

```python
from typing import List, Optional, Dict, Tuple, Callable, Any
from crawler import GoogleImageCrawler, ImageResult, search_images, search_images_sync
from downloader import ImageDownloader, download_from_list
from config import DownloadConfig

# 异步搜索
async def async_search() -> List[ImageResult]:
    async with GoogleImageCrawler() as crawler:
        return await crawler.search("keyword")

# 同步搜索
def sync_search() -> List[ImageResult]:
    return search_images_sync("keyword")

# 批量下载
def batch_download(urls: List[str]) -> Dict[str, List[Dict]]:
    with ImageDownloader() as dl:
        return dl.download_batch(urls)

# 单张下载
def single_download(url: str) -> Tuple[bool, str]:
    with ImageDownloader() as dl:
        return dl.download_single(url)
```
