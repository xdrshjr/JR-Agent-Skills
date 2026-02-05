#!/usr/bin/env python3
"""
Google 图片爬虫 - 爬取图片 URL

用法:
    python crawl.py --keyword "cat" --count 10 --output images.json
    
作为模块使用:
    from scripts.crawl import crawl_images
    results = await crawl_images(keyword="cat", count=10)
"""

import os
import sys
import json
import asyncio
import argparse
from pathlib import Path
from typing import List, Optional, Dict, Any

# 添加项目根目录到路径
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

from core.crawler import GoogleImageCrawler, ImageResult


def create_parser() -> argparse.ArgumentParser:
    """创建命令行参数解析器"""
    parser = argparse.ArgumentParser(
        prog='crawl',
        description='Google 图片 URL 爬虫 - 提取高清原图地址',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 基础搜索
  python crawl.py --keyword "cute cat" --count 20
  
  # 指定尺寸过滤并保存结果
  python crawl.py -k "landscape" -c 50 --min-width 1920 --min-height 1080 -o landscapes.json
  
  # 非无头模式（可见浏览器）
  python crawl.py -k "puppy" --no-headless
  
  # 使用代理
  python crawl.py -k "anime" --proxy "http://127.0.0.1:8080"
        """
    )
    
    # 搜索参数
    parser.add_argument(
        '-k', '--keyword',
        required=True,
        help='搜索关键词（必填）'
    )
    parser.add_argument(
        '-c', '--count',
        type=int,
        default=10,
        help='需要获取的图片数量（默认: 10）'
    )
    parser.add_argument(
        '--min-width',
        type=int,
        default=None,
        help='最小宽度过滤（像素）'
    )
    parser.add_argument(
        '--min-height',
        type=int,
        default=None,
        help='最小高度过滤（像素）'
    )
    
    # 输出选项
    parser.add_argument(
        '-o', '--output',
        default=None,
        help='输出 JSON 文件路径（默认: stdout）'
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='格式化 JSON 输出'
    )
    
    # 爬虫选项
    parser.add_argument(
        '--no-headless',
        action='store_true',
        help='显示浏览器窗口（非无头模式）'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='页面加载超时（秒，默认: 30）'
    )
    parser.add_argument(
        '--max-retries',
        type=int,
        default=3,
        help='最大重试次数（默认: 3）'
    )
    parser.add_argument(
        '--proxy',
        default=None,
        help='代理服务器地址，如 http://127.0.0.1:8080'
    )
    parser.add_argument(
        '--unsafe',
        action='store_true',
        help='关闭安全搜索'
    )
    
    # 其他
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='显示详细日志'
    )
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 1.0.0'
    )
    
    return parser


def image_result_to_dict(result: ImageResult) -> Dict[str, Any]:
    """将 ImageResult 转换为字典"""
    return {
        'url': result.url,
        'thumbnail_url': result.thumbnail_url,
        'title': result.title,
        'source_url': result.source_url,
        'width': result.width,
        'height': result.height,
    }


async def crawl_images(
    keyword: str,
    count: int = 10,
    min_width: Optional[int] = None,
    min_height: Optional[int] = None,
    headless: bool = True,
    timeout: int = 30,
    max_retries: int = 3,
    proxy: Optional[str] = None,
    safe_search: bool = True,
    verbose: bool = False
) -> List[Dict[str, Any]]:
    """
    爬取 Google 图片 URL
    
    Args:
        keyword: 搜索关键词
        count: 需要的图片数量
        min_width: 最小宽度过滤
        min_height: 最小高度过滤
        headless: 是否无头模式
        timeout: 超时时间（秒）
        max_retries: 最大重试次数
        proxy: 代理地址
        safe_search: 是否开启安全搜索
        verbose: 是否显示详细日志
        
    Returns:
        List[Dict]: 图片信息列表，每个字典包含:
            - url: 原始高清图片 URL
            - thumbnail_url: 缩略图 URL
            - title: 图片标题
            - source_url: 来源网页 URL
            - width: 图片宽度（可能为 null）
            - height: 图片高度（可能为 null）
    """
    if verbose:
        print(f"[INFO] 开始搜索: {keyword}", file=sys.stderr)
        print(f"[INFO] 目标数量: {count}", file=sys.stderr)
    
    async with GoogleImageCrawler(
        headless=headless,
        timeout=timeout,
        max_retries=max_retries,
        proxy=proxy
    ) as crawler:
        results = await crawler.search(
            keyword=keyword,
            num_images=count,
            safe_search=safe_search,
            min_width=min_width,
            min_height=min_height
        )
        
        if verbose:
            print(f"[INFO] 获取到 {len(results)} 张图片", file=sys.stderr)
        
        return [image_result_to_dict(r) for r in results]


def output_results(
    results: List[Dict[str, Any]],
    output_path: Optional[str] = None,
    pretty: bool = False
) -> None:
    """输出结果到文件或 stdout"""
    indent = 2 if pretty else None
    json_str = json.dumps(results, ensure_ascii=False, indent=indent)
    
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(json_str, encoding='utf-8')
        print(f"结果已保存: {output_path}", file=sys.stderr)
    else:
        print(json_str)


async def main_async():
    """异步主函数"""
    parser = create_parser()
    args = parser.parse_args()
    
    try:
        results = await crawl_images(
            keyword=args.keyword,
            count=args.count,
            min_width=args.min_width,
            min_height=args.min_height,
            headless=not args.no_headless,
            timeout=args.timeout,
            max_retries=args.max_retries,
            proxy=args.proxy,
            safe_search=not args.unsafe,
            verbose=args.verbose
        )
        
        output_results(results, args.output, args.pretty)
        
    except KeyboardInterrupt:
        print("\n[WARNING] 用户中断", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """同步入口点"""
    asyncio.run(main_async())


if __name__ == '__main__':
    main()
