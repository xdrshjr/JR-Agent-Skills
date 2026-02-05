# 使用示例集

本文档提供 Google Image Crawler 的各种使用场景示例。

## 目录

- [基础示例](#基础示例)
- [高级搜索](#高级搜索)
- [批量下载](#批量下载)
- [工作流组合](#工作流组合)
- [命令行使用](#命令行使用)
- [错误处理](#错误处理)
- [实际应用场景](#实际应用场景)

---

## 基础示例

### 示例 1: 最简单的搜索

```python
import asyncio
from crawler import GoogleImageCrawler

async def main():
    async with GoogleImageCrawler() as crawler:
        results = await crawler.search("puppy", num_images=5)
        
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.url}")

asyncio.run(main())
```

### 示例 2: 使用同步 API

```python
from crawler import search_images_sync

# 最简单的调用方式
results = search_images_sync("kitten", num_images=5)

for result in results:
    print(f"URL: {result.url}")
    print(f"Size: {result.width}x{result.height}")
```

### 示例 3: 显示详细信息

```python
import asyncio
from crawler import GoogleImageCrawler

async def detailed_search():
    async with GoogleImageCrawler() as crawler:
        results = await crawler.search("sunset", num_images=10)
        
        print(f"共找到 {len(results)} 张图片\n")
        
        for i, result in enumerate(results, 1):
            print(f"[{i}] {result.title or '无标题'}")
            print(f"    URL: {result.url}")
            print(f"    缩略图: {result.thumbnail_url}")
            print(f"    来源: {result.source_url}")
            print(f"    尺寸: {result.width or '未知'} x {result.height or '未知'}")
            print()

asyncio.run(detailed_search())
```

---

## 高级搜索

### 示例 4: HD 壁纸搜索

```python
import asyncio
from crawler import GoogleImageCrawler

async def hd_wallpaper_search():
    """搜索 1920x1080 以上的高清壁纸"""
    
    async with GoogleImageCrawler() as crawler:
        results = await crawler.search(
            keyword="4k nature wallpaper",
            num_images=20,
            min_width=1920,
            min_height=1080
        )
        
        print(f"找到 {len(results)} 张高清壁纸:\n")
        
        for result in results:
            resolution = f"{result.width}x{result.height}" if result.width and result.height else "未知"
            print(f"✓ [{resolution}] {result.url[:60]}...")

asyncio.run(hd_wallpaper_search())
```

### 示例 5: 多关键词搜索

```python
import asyncio
from crawler import GoogleImageCrawler
from typing import List, Dict

async def multi_keyword_search():
    """同时搜索多个关键词"""
    
    keywords = ["cat", "dog", "bird", "fish"]
    all_results: Dict[str, List] = {}
    
    async with GoogleImageCrawler() as crawler:
        for keyword in keywords:
            print(f"正在搜索: {keyword}...")
            results = await crawler.search(keyword, num_images=5)
            all_results[keyword] = results
            print(f"  ✓ 找到 {len(results)} 张图片")
    
    # 统计结果
    print("\n" + "="*50)
    print("搜索完成!")
    for keyword, results in all_results.items():
        print(f"{keyword}: {len(results)} 张")

asyncio.run(multi_keyword_search())
```

### 示例 6: 自定义搜索参数

```python
import asyncio
from crawler import GoogleImageCrawler

async def custom_search():
    """使用自定义参数进行搜索"""
    
    async with GoogleImageCrawler(
        headless=False,        # 显示浏览器窗口（调试用）
        timeout=60,            # 增加超时时间
        scroll_pause=2.5,      # 增加滚动间隔（更慢但更稳定）
        max_retries=5          # 增加重试次数
    ) as crawler:
        
        results = await crawler.search(
            keyword="vintage car",
            num_images=30,
            safe_search=True,
            min_width=800
        )
        
        print(f"找到 {len(results)} 张图片")

asyncio.run(custom_search())
```

---

## 批量下载

### 示例 7: 搜索并下载（基础版）

```python
import asyncio
from crawler import GoogleImageCrawler

async def search_and_download():
    """搜索图片并直接下载"""
    
    async with GoogleImageCrawler() as crawler:
        # 搜索
        print("正在搜索图片...")
        results = await crawler.search("cute puppy", num_images=10)
        
        # 下载
        print(f"找到 {len(results)} 张图片，开始下载...")
        downloaded = await crawler.download_images(
            results,
            output_dir="./puppy_images",
            concurrency=3
        )
        
        print(f"\n下载完成!")
        print(f"成功: {len(downloaded)}/{len(results)}")
        
        # 显示下载的文件
        for path in downloaded:
            print(f"  ✓ {path}")

asyncio.run(search_and_download())
```

### 示例 8: 使用独立下载模块

```python
from downloader import ImageDownloader

def download_with_progress():
    """使用独立下载模块，支持进度显示"""
    
    urls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg",
        # ... 更多 URL
    ]
    
    def on_progress(current, total):
        percentage = (current / total) * 100
        print(f"\r进度: {current}/{total} ({percentage:.1f}%)", end="")
    
    with ImageDownloader(
        output_dir="./downloads",
        concurrent=5,
        timeout=30,
        max_retries=3
    ) as downloader:
        
        results = downloader.download_batch(
            urls,
            subfolder="batch_001",
            progress_callback=on_progress
        )
        
        print("\n\n下载统计:")
        print(f"  成功: {len(results['success'])}")
        print(f"  失败: {len(results['failed'])}")
        
        if results['failed']:
            print("\n失败的 URL:")
            for item in results['failed']:
                print(f"  ✗ {item['url']}")
                print(f"    错误: {item['error']}")

download_with_progress()
```

### 示例 9: 带元数据的下载

```python
from downloader import ImageDownloader

def download_with_metadata():
    """下载图片并保留元数据"""
    
    items = [
        {
            "url": "https://example.com/cat.jpg",
            "filename": "cat_001.jpg",
            "metadata": {
                "category": "animals",
                "tag": "cat",
                "source": "example.com"
            }
        },
        {
            "url": "https://example.com/dog.jpg",
            "filename": "dog_001.jpg",
            "metadata": {
                "category": "animals",
                "tag": "dog",
                "source": "example.com"
            }
        }
    ]
    
    with ImageDownloader(output_dir="./downloads") as downloader:
        results = downloader.download_with_metadata(items)
        
        # 保存元数据到 JSON
        import json
        with open("./downloads/metadata.json", "w") as f:
            json.dump(results['success'], f, indent=2)
        
        print(f"下载完成，元数据已保存")
        for item in results['success']:
            print(f"  ✓ {item['path']}")
            print(f"    标签: {item['metadata'].get('tag')}")

download_with_metadata()
```

---

## 工作流组合

### 示例 10: 完整工作流（搜索+下载+保存结果）

```python
import asyncio
import json
from pathlib import Path
from crawler import GoogleImageCrawler
from downloader import ImageDownloader

async def complete_workflow():
    """完整的工作流示例"""
    
    keyword = "mountain landscape"
    output_dir = Path("./mountain_images")
    output_dir.mkdir(exist_ok=True)
    
    # 步骤 1: 搜索图片
    print(f"步骤 1: 搜索 '{keyword}'...")
    async with GoogleImageCrawler() as crawler:
        search_results = await crawler.search(
            keyword=keyword,
            num_images=20,
            min_width=1000,
            min_height=800
        )
    
    print(f"  ✓ 找到 {len(search_results)} 张图片")
    
    # 步骤 2: 保存搜索结果
    print("\n步骤 2: 保存搜索结果...")
    search_data = []
    for result in search_results:
        search_data.append({
            "url": result.url,
            "title": result.title,
            "source_url": result.source_url,
            "width": result.width,
            "height": result.height
        })
    
    with open(output_dir / "search_results.json", "w") as f:
        json.dump(search_data, f, indent=2, ensure_ascii=False)
    
    print(f"  ✓ 结果已保存到 {output_dir / 'search_results.json'}")
    
    # 步骤 3: 下载图片
    print("\n步骤 3: 下载图片...")
    urls = [r.url for r in search_results]
    
    with ImageDownloader(
        output_dir=str(output_dir),
        concurrent=5,
        max_retries=3
    ) as downloader:
        download_results = downloader.download_batch(urls)
    
    # 步骤 4: 保存下载结果
    print("\n步骤 4: 保存下载报告...")
    report = {
        "keyword": keyword,
        "total_search": len(search_results),
        "total_downloaded": len(download_results['success']),
        "failed": len(download_results['failed']),
        "success_rate": len(download_results['success']) / len(search_results) * 100
    }
    
    with open(output_dir / "report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    # 输出摘要
    print("\n" + "="*50)
    print("工作流完成!")
    print("="*50)
    print(f"搜索关键词: {keyword}")
    print(f"搜索数量: {report['total_search']}")
    print(f"下载成功: {report['total_downloaded']}")
    print(f"下载失败: {report['failed']}")
    print(f"成功率: {report['success_rate']:.1f}%")
    print(f"输出目录: {output_dir}")

asyncio.run(complete_workflow())
```

### 示例 11: 分批处理大量图片

```python
import asyncio
from crawler import GoogleImageCrawler
from downloader import ImageDownloader
from typing import List

async def batch_process():
    """分批处理大量图片"""
    
    keywords = ["nature", "city", "ocean", "forest", "desert"]
    batch_size = 10  # 每批下载数量
    
    for keyword in keywords:
        print(f"\n{'='*50}")
        print(f"处理关键词: {keyword}")
        print(f"{'='*50}")
        
        # 搜索
        async with GoogleImageCrawler() as crawler:
            results = await crawler.search(keyword, num_images=batch_size)
        
        urls = [r.url for r in results]
        print(f"找到 {len(urls)} 张图片")
        
        # 分批下载
        with ImageDownloader(
            output_dir=f"./downloads/{keyword}",
            concurrent=3
        ) as downloader:
            download_results = downloader.download_batch(urls)
        
        success = len(download_results['success'])
        failed = len(download_results['failed'])
        print(f"下载完成: 成功 {success}, 失败 {failed}")
        
        # 保存失败的 URL 以便重试
        if download_results['failed']:
            with open(f"./downloads/{keyword}_failed.txt", "w") as f:
                for item in download_results['failed']:
                    f.write(item['url'] + "\n")

asyncio.run(batch_process())
```

### 示例 12: 断点续传

```python
import json
from pathlib import Path
from downloader import ImageDownloader

def resume_download():
    """从断点继续下载"""
    
    failed_urls_file = Path("./downloads/failed_urls.txt")
    output_dir = "./downloads"
    
    if not failed_urls_file.exists():
        print("没有失败的 URL 需要重试")
        return
    
    # 读取失败的 URL
    with open(failed_urls_file, "r") as f:
        urls = [line.strip() for line in f if line.strip()]
    
    print(f"准备重试 {len(urls)} 个失败的下载...")
    
    with ImageDownloader(
        output_dir=output_dir,
        concurrent=3,
        max_retries=5,  # 增加重试次数
        timeout=60      # 增加超时时间
    ) as downloader:
        results = downloader.download_batch(urls)
    
    # 更新失败列表
    still_failed = [item['url'] for item in results['failed']]
    
    if still_failed:
        with open(failed_urls_file, "w") as f:
            for url in still_failed:
                f.write(url + "\n")
        print(f"仍有 {len(still_failed)} 个 URL 失败，已保存到文件")
    else:
        failed_urls_file.unlink()  # 删除空文件
        print("所有失败的下载都已成功!")
    
    print(f"本次成功: {len(results['success'])}")

resume_download()
```

---

## 命令行使用

### 示例 13: 从 URL 文件下载

```bash
# 创建 URL 列表文件
cat > urls.txt << EOF
https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg
EOF

# 执行下载
python cli.py -f urls.txt -o ./downloads -c 5
```

### 示例 14: 下载单张图片

```bash
python cli.py -u "https://example.com/image.jpg" -o ./downloads
```

### 示例 15: 高级命令行参数

```bash
python cli.py \
    -f urls.txt \
    -o ./downloads \
    -c 10 \              # 10 并发
    -t 60 \              # 60 秒超时
    -r 5 \               # 5 次重试
    -l 100 \             # 限制下载 100 张
    --proxy "http://127.0.0.1:8080" \
    --save-json results.json \
    --save-failed failed.txt
```

### 示例 16: 生成 URL 列表文件

```python
import asyncio
from crawler import GoogleImageCrawler

async def generate_url_list():
    """生成 URL 列表文件供 CLI 使用"""
    
    keywords = ["cat", "dog", "bird"]
    
    with open("image_urls.txt", "w") as f:
        async with GoogleImageCrawler() as crawler:
            for keyword in keywords:
                print(f"搜索: {keyword}")
                results = await crawler.search(keyword, num_images=10)
                
                for result in results:
                    f.write(result.url + "\n")
                
                print(f"  添加 {len(results)} 个 URL")
    
    print("\nURL 列表已保存到 image_urls.txt")
    print("使用命令行下载: python cli.py -f image_urls.txt -o ./downloads")

asyncio.run(generate_url_list())
```

---

## 错误处理

### 示例 17: 健壮的错误处理

```python
import asyncio
from crawler import GoogleImageCrawler

async def robust_search():
    """健壮的错误处理示例"""
    
    keywords = ["cat", "dog", "invalid::keyword", "bird"]
    results = {}
    
    for keyword in keywords:
        try:
            print(f"搜索: {keyword}...")
            async with GoogleImageCrawler(
                timeout=30,
                max_retries=2
            ) as crawler:
                search_results = await crawler.search(keyword, num_images=5)
                results[keyword] = search_results
                print(f"  ✓ 成功: {len(search_results)} 张")
        
        except Exception as e:
            print(f"  ✗ 失败: {str(e)[:50]}")
            results[keyword] = []
    
    print("\n最终结果:")
    for keyword, items in results.items():
        print(f"  {keyword}: {len(items)} 张")

asyncio.run(robust_search())
```

### 示例 18: 网络错误重试

```python
import asyncio
from crawler import GoogleImageCrawler

async def retry_with_backoff():
    """使用指数退避重试"""
    
    max_attempts = 3
    
    for attempt in range(1, max_attempts + 1):
        try:
            print(f"尝试 {attempt}/{max_attempts}...")
            async with GoogleImageCrawler() as crawler:
                results = await crawler.search("test", num_images=5)
                print(f"成功! 找到 {len(results)} 张图片")
                return results
        
        except Exception as e:
            print(f"失败: {e}")
            if attempt < max_attempts:
                wait_time = 2 ** attempt  # 指数退避: 2, 4, 8 秒
                print(f"等待 {wait_time} 秒后重试...")
                await asyncio.sleep(wait_time)
    
    print("所有尝试都失败了")
    return []

asyncio.run(retry_with_backoff())
```

---

## 实际应用场景

### 示例 19: 数据集构建

```python
import asyncio
import json
from pathlib import Path
from crawler import GoogleImageCrawler
from downloader import ImageDownloader

async def build_dataset():
    """为机器学习构建图像数据集"""
    
    # 定义类别和关键词
    categories = {
        "cat": ["domestic cat", "kitten", "tabby cat"],
        "dog": ["golden retriever", "puppy", "husky dog"],
        "bird": ["cardinal bird", "blue jay", "robin bird"]
    }
    
    dataset_dir = Path("./image_dataset")
    dataset_dir.mkdir(exist_ok=True)
    
    metadata = []
    
    for category, keywords in categories.items():
        category_dir = dataset_dir / category
        category_dir.mkdir(exist_ok=True)
        
        print(f"\n处理类别: {category}")
        
        for keyword in keywords:
            print(f"  搜索: {keyword}")
            
            # 搜索
            async with GoogleImageCrawler() as crawler:
                results = await crawler.search(keyword, num_images=20)
            
            # 准备下载项
            items = []
            for i, result in enumerate(results):
                items.append({
                    "url": result.url,
                    "filename": f"{category}_{keyword.replace(' ', '_')}_{i:04d}.jpg",
                    "metadata": {
                        "category": category,
                        "keyword": keyword,
                        "original_url": result.url,
                        "width": result.width,
                        "height": result.height
                    }
                })
            
            # 下载
            with ImageDownloader(output_dir=str(category_dir)) as downloader:
                download_results = downloader.download_with_metadata(items)
            
            # 收集元数据
            for item in download_results['success']:
                metadata.append(item['metadata'])
            
            print(f"    成功: {len(download_results['success'])}")
    
    # 保存数据集元数据
    with open(dataset_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print("\n" + "="*50)
    print("数据集构建完成!")
    print(f"总图片数: {len(metadata)}")
    print(f"保存位置: {dataset_dir}")

asyncio.run(build_dataset())
```

### 示例 20: 壁纸自动下载器

```python
import asyncio
from datetime import datetime
from crawler import GoogleImageCrawler
from downloader import ImageDownloader

async def wallpaper_downloader():
    """自动下载每日壁纸"""
    
    # 壁纸主题
    themes = [
        "nature landscape 4k",
        "abstract art wallpaper",
        "minimalist wallpaper",
        "space galaxy wallpaper"
    ]
    
    # 今天的主题
    theme_index = datetime.now().day % len(themes)
    today_theme = themes[theme_index]
    
    print(f"今日壁纸主题: {today_theme}")
    
    # 搜索高清壁纸
    async with GoogleImageCrawler(
        timeout=60,
        scroll_pause=2.0
    ) as crawler:
        results = await crawler.search(
            keyword=today_theme,
            num_images=10,
            min_width=1920,
            min_height=1080
        )
    
    if not results:
        print("没有找到合适的壁纸")
        return
    
    # 按分辨率排序
    sorted_results = sorted(
        results,
        key=lambda x: (x.width or 0) * (x.height or 0),
        reverse=True
    )
    
    # 下载前 3 张
    top_3 = sorted_results[:3]
    
    print(f"\n下载前 3 张最高分辨率壁纸...")
    
    with ImageDownloader(output_dir="./wallpapers") as downloader:
        for i, result in enumerate(top_3, 1):
            resolution = f"{result.width}x{result.height}" if result.width and result.height else "未知"
            print(f"\n[{i}] 分辨率: {resolution}")
            print(f"    URL: {result.url[:60]}...")
        
        # 下载
        urls = [r.url for r in top_3]
        download_results = downloader.download_batch(
            urls,
            subfolder=datetime.now().strftime("%Y-%m-%d")
        )
    
    print(f"\n✓ 壁纸已保存到 ./wallpapers/{datetime.now().strftime('%Y-%m-%d')}/")

asyncio.run(wallpaper_downloader())
```

### 示例 21: 图片 URL 验证工具

```python
import asyncio
import json
from urllib.parse import urlparse
from crawler import GoogleImageCrawler

async def validate_urls():
    """验证图片 URL 的有效性"""
    
    # 假设有一些 URL 需要验证
    urls_to_check = [
        "https://valid-image.com/photo.jpg",
        "https://example.com/image.png",
        "invalid-url",
        "http://another-site.com/pic.webp"
    ]
    
    valid_urls = []
    invalid_urls = []
    
    for url in urls_to_check:
        parsed = urlparse(url)
        
        # 基本验证
        if not parsed.scheme or not parsed.netloc:
            invalid_urls.append({"url": url, "reason": "无效 URL 格式"})
            continue
        
        if parsed.scheme not in ['http', 'https']:
            invalid_urls.append({"url": url, "reason": "不支持的协议"})
            continue
        
        # 检查扩展名
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        path = parsed.path.lower()
        if any(path.endswith(ext) for ext in valid_extensions):
            valid_urls.append(url)
        else:
            # 没有扩展名也可以接受
            valid_urls.append(url)
    
    # 保存结果
    result = {
        "valid": valid_urls,
        "invalid": invalid_urls,
        "stats": {
            "total": len(urls_to_check),
            "valid": len(valid_urls),
            "invalid": len(invalid_urls)
        }
    }
    
    with open("url_validation_result.json", "w") as f:
        json.dump(result, f, indent=2)
    
    print("URL 验证完成!")
    print(f"有效: {len(valid_urls)}")
    print(f"无效: {len(invalid_urls)}")

asyncio.run(validate_urls())
```

---

## 更多技巧

### 使用代理

```python
async with GoogleImageCrawler(
    proxy="http://user:pass@proxy:8080"
) as crawler:
    results = await crawler.search("keyword")
```

### 自定义请求头

```python
from downloader import ImageDownloader

downloader = ImageDownloader(
    headers={
        "User-Agent": "Custom Bot 1.0",
        "Referer": "https://custom-site.com/"
    }
)
```

### 过滤特定域名

```python
async with GoogleImageCrawler() as crawler:
    results = await crawler.search("keyword", num_images=50)
    
    # 过滤只保留特定域名
    allowed_domains = ["unsplash.com", "pexels.com"]
    filtered = [
        r for r in results
        if any(domain in r.url for domain in allowed_domains)
    ]
```

### 限制文件大小

```python
from downloader import ImageDownloader

downloader = ImageDownloader(
    max_file_size=10 * 1024 * 1024  # 10MB
)
```
