#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片搜索和下载工具 - 修复版 (v2.0)
支持多个图片来源，带失败回退

修复内容:
- 修复Wikimedia API调用，使用正确的imageinfo接口获取实际图片URL
- 移除已停用的Unsplash Source API
- 新增Bing图片搜索作为备选来源
- 新增直接URL源（预设常见图片的直接链接）
- 改进错误处理和重试机制
"""

import argparse
import json
import urllib.request
import urllib.parse
import ssl
import re
from pathlib import Path
from PIL import Image
import time

# 禁用SSL验证（某些环境下需要）
ssl._create_default_https_context = ssl._create_unverified_context

class ImageDownloader:
    """图片下载器 - 修复版"""
    
    def __init__(self, output_dir="images"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    
    def download_image(self, url, filename, timeout=20):
        """下载单张图片"""
        output_path = self.output_dir / filename
        
        # 如果文件已存在，直接返回
        if output_path.exists():
            print(f"   ✅ 文件已存在: {filename}")
            return True
        
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                data = response.read()
                
                # 检查是否是有效图片
                if len(data) < 2000:
                    print(f"   ⚠️  文件太小: {len(data)} bytes")
                    return False
                
                # 保存
                output_path.write_bytes(data)
                
                # 验证图片
                try:
                    with Image.open(output_path) as img:
                        img.verify()
                    size_kb = len(data) / 1024
                    print(f"   ✅ 成功下载 ({size_kb:.1f} KB): {filename}")
                    return True
                except Exception as e:
                    print(f"   ⚠️  无效图片: {e}")
                    output_path.unlink(missing_ok=True)
                    return False
                    
        except Exception as e:
            print(f"   ❌ 下载失败: {str(e)[:50]}")
            return False
    
    def search_wikimedia(self, query, count=3):
        """从Wikimedia Commons搜索图片 - 修复版
        
        使用正确的API流程:
        1. 使用search API搜索文件
        2. 使用imageinfo API获取实际图片URL
        3. 下载图片
        """
        print(f"🔍 Wikimedia搜索: {query}")
        
        # Wikimedia搜索API
        api_url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&format=json&srlimit={count*2}"
        
        try:
            req = urllib.request.Request(api_url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                results = []
                for item in data.get('query', {}).get('search', []):
                    title = item.get('title', '').replace('File:', '')
                    if not title:
                        continue
                    
                    # 获取文件详细信息（包括实际URL）
                    file_info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size|mime&format=json"
                    
                    try:
                        req2 = urllib.request.Request(file_info_url, headers=self.headers)
                        with urllib.request.urlopen(req2, timeout=15) as response2:
                            data2 = json.loads(response2.read().decode('utf-8'))
                            pages = data2.get('query', {}).get('pages', {})
                            
                            for page_id, page_info in pages.items():
                                imageinfo = page_info.get('imageinfo', [])
                                if imageinfo:
                                    img_url = imageinfo[0].get('url')
                                    if img_url:
                                        print(f"   找到: {title[:50]}")
                                        # 使用查询关键词作为文件名前缀
                                        safe_query = query.replace(' ', '_')[:30]
                                        safe_name = f"{safe_query}_{len(results)}.jpg"
                                        
                                        if self.download_image(img_url, safe_name):
                                            results.append(img_url)
                                        
                                        if len(results) >= count:
                                            return results
                                        time.sleep(0.5)
                    except Exception as e:
                        print(f"   获取文件信息失败: {e}")
                        continue
                
                return results
                
        except Exception as e:
            print(f"   ❌ 搜索失败: {e}")
            return []
    
    def search_bing_images(self, query, count=3):
        """使用Bing图片搜索作为备选来源"""
        print(f"🔍 Bing图片搜索: {query}")
        
        try:
            # Bing图片搜索
            search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&form=HDRSC2&first=1"
            req = urllib.request.Request(search_url, headers=self.headers)
            
            with urllib.request.urlopen(req, timeout=15) as response:
                html = response.read().decode('utf-8')
                
                # 提取图片URL（Bing图片通常在JSON数据或特定HTML结构中）
                img_urls = []
                
                # 尝试多种模式匹配
                patterns = [
                    r'murl":"(https://[^"]+\.(?:jpg|jpeg|png))"',  # 直接图片URL
                    r'"ou":"(https://[^"]+\.(?:jpg|jpeg|png))"',  # 原始URL
                    r'https://tse\d+\.mm\.bing\.net/th\?id=[^\s"<>]+',  # Bing缩略图
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, html, re.IGNORECASE)
                    for url in matches:
                        if url not in img_urls and len(img_urls) < count * 3:
                            img_urls.append(url)
                
                results = []
                for i, img_url in enumerate(img_urls[:count]):
                    safe_query = query.replace(' ', '_')[:30]
                    safe_name = f"{safe_query}_bing_{i}.jpg"
                    if self.download_image(img_url, safe_name):
                        results.append(img_url)
                        if len(results) >= count:
                            break
                    time.sleep(0.5)
                
                return results
                
        except Exception as e:
            print(f"   ❌ Bing搜索失败: {e}")
            return []
    
    def search_direct_urls(self, query, count=3):
        """使用预设的直接URL（针对常见主题）
        
        优点：绕过搜索API，直接使用已知的有效图片链接
        适用于：艺术史常见主题（塔特林塔、构成主义作品等）
        """
        print(f"🔍 直接URL搜索: {query}")
        
        # 预设常见图片的直接URL
        direct_urls = {
            "tatlin tower": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Tatlin_Tower.jpg/800px-Tatlin_Tower.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Monument_to_the_Third_International.jpg/800px-Monument_to_the_Third_International.jpg",
            ],
            "constructivism": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rodchenko_Constructivist.jpg/800px-Rodchenko_Constructivist.jpg",
            ],
            "rodchenko": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Alexander_Rodchenko.jpg/800px-Alexander_Rodchenko.jpg",
            ],
            "lissitzky": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/El_Lissitzky.jpg/800px-El_Lissitzky.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Lissitzky_Proun.jpg/800px-Lissitzky_Proun.jpg",
            ],
            "material design": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Material_Design.svg/1024px-Material_Design.svg.png",
            ],
        }
        
        results = []
        query_lower = query.lower()
        
        for key, urls in direct_urls.items():
            if key in query_lower:
                for i, url in enumerate(urls[:count]):
                    safe_query = query.replace(' ', '_')[:30]
                    safe_name = f"{safe_query}_direct_{i}.jpg"
                    if self.download_image(url, safe_name):
                        results.append(url)
                        if len(results) >= count:
                            break
                    time.sleep(0.5)
                break
        
        return results
    
    def search_with_retry(self, query, sources=None, max_per_source=2):
        """
        多源搜索带重试
        
        参数:
            query: 搜索关键词
            sources: 图片来源列表 ['direct', 'wikimedia', 'bing', ...]
            max_per_source: 每个来源最大下载数
        
        默认搜索顺序：direct -> wikimedia -> bing
        """
        if sources is None:
            sources = ['direct', 'wikimedia', 'bing']
        
        all_results = []
        
        for source in sources:
            print(f"\n📡 尝试来源: {source}")
            
            if source == 'direct':
                results = self.search_direct_urls(query, max_per_source)
            elif source == 'wikimedia':
                results = self.search_wikimedia(query, max_per_source)
            elif source == 'bing':
                results = self.search_bing_images(query, max_per_source)
            else:
                print(f"   未知来源: {source}")
                continue
            
            all_results.extend(results)
            
            if len(all_results) >= max_per_source:
                print(f"✅ 已下载足够图片 ({len(all_results)}张)")
                break
            
            time.sleep(1)  # 来源间延迟，避免请求过快
        
        return all_results


def create_placeholder_image(name, title, output_dir, size=(800, 600)):
    """创建占位图（当网络下载失败时）"""
    from PIL import ImageDraw, ImageFont
    
    output_path = Path(output_dir) / f"{name}.jpg"
    
    # 如果文件已存在，跳过
    if output_path.exists():
        print(f"   ✅ 占位图已存在: {output_path}")
        return output_path
    
    # 创建图像
    img = Image.new('RGB', size, (240, 240, 240))
    draw = ImageDraw.Draw(img)
    
    # 尝试获取字体
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 36)
        font_note = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 18)
    except:
        font_title = ImageFont.load_default()
        font_note = font_title
    
    # 绘制装饰（构成主义风格）
    draw.rectangle([(40, 100), (60, size[1]-100)], fill=(200, 50, 50))
    draw.rectangle([(40, size[1]-80), (300, size[1]-60)], fill=(200, 50, 50))
    
    # 绘制文字
    draw.text((100, size[1]//2 - 30), title, fill=(100, 100, 100), font=font_title)
    draw.text((100, size[1] - 50), f"[{name}]", fill=(180, 180, 180), font=font_note)
    
    img.save(output_path, 'JPEG', quality=90)
    print(f"   ✅ 占位图已创建: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="图片搜索下载工具 - 修复版")
    parser.add_argument("--query", "-q", required=True, help="搜索关键词")
    parser.add_argument("--output", "-o", default="images", help="输出目录")
    parser.add_argument("--count", "-n", type=int, default=3, help="下载数量")
    parser.add_argument("--sources", "-s", nargs='+', 
                       default=['direct', 'wikimedia', 'bing'],
                       help="图片来源: direct(直接URL), wikimedia, bing")
    parser.add_argument("--placeholder", "-p", action="store_true",
                       help="如果下载失败则创建占位图")
    parser.add_argument("--name", default="image", help="占位图文件名")
    
    args = parser.parse_args()
    
    print("="*60)
    print("图片搜索下载工具 - 修复版")
    print("="*60)
    print(f"搜索: {args.query}")
    print(f"来源: {', '.join(args.sources)}")
    print(f"数量: {args.count}")
    
    # 创建下载器
    downloader = ImageDownloader(output_dir=args.output)
    
    # 搜索下载
    results = downloader.search_with_retry(
        args.query,
        sources=args.sources,
        max_per_source=args.count
    )
    
    print("\n" + "="*60)
    print(f"📊 结果: 成功下载 {len(results)} 张图片")
    
    # 如果失败且启用占位图
    if len(results) == 0 and args.placeholder:
        print("\n📝 创建占位图...")
        create_placeholder_image(args.name, args.query, args.output)
    
    print("="*60)


if __name__ == "__main__":
    main()
