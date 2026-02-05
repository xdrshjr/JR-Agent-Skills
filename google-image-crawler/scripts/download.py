#!/usr/bin/env python3
"""
Google 图片下载器 - 批量下载图片

用法:
    python download.py --urls-file images.json --output-dir ./downloads
    cat urls.txt | python download.py --output-dir ./downloads
    
作为模块使用:
    from scripts.download import download_images
    results = download_images(urls=["http://..."], output_dir="./downloads")
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Optional, Dict, Any, TextIO

# 添加项目根目录到路径
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

from core.downloader import ImageDownloader


def create_parser() -> argparse.ArgumentParser:
    """创建命令行参数解析器"""
    parser = argparse.ArgumentParser(
        prog='download',
        description='批量下载图片工具 - 支持并发、重试、进度显示',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 从 JSON 文件下载（由 crawl.py 生成）
  python download.py -f images.json -o ./downloads
  
  # 从 URL 列表文件下载（每行一个 URL）
  python download.py -f urls.txt -o ./downloads
  
  # 从 stdin 读取 URL 列表
  cat urls.txt | python download.py -o ./downloads
  
  # 指定并发数和超时
  python download.py -f images.json -c 10 -t 60 -o ./downloads
  
  # 只提取 JSON 中的 URL 字段
  python download.py -f images.json --url-field url -o ./downloads
        """
    )
    
    # 输入选项
    parser.add_argument(
        '-f', '--urls-file',
        default=None,
        help='URL 列表文件路径（JSON 或纯文本，每行一个 URL）'
    )
    parser.add_argument(
        '--url-field',
        default='url',
        help='JSON 文件中 URL 字段名（默认: url）'
    )
    
    # 输出选项
    parser.add_argument(
        '-o', '--output-dir',
        default='./downloads',
        help='输出目录（默认: ./downloads）'
    )
    parser.add_argument(
        '--save-report',
        default=None,
        help='保存下载报告到 JSON 文件'
    )
    parser.add_argument(
        '--save-failed',
        default=None,
        help='保存失败的 URL 到文件'
    )
    
    # 下载选项
    parser.add_argument(
        '-c', '--concurrent',
        type=int,
        default=5,
        help='并发下载数（默认: 5）'
    )
    parser.add_argument(
        '-t', '--timeout',
        type=int,
        default=30,
        help='请求超时时间（秒，默认: 30）'
    )
    parser.add_argument(
        '-r', '--retries',
        type=int,
        default=3,
        help='最大重试次数（默认: 3）'
    )
    parser.add_argument(
        '-l', '--limit',
        type=int,
        default=None,
        help='限制下载数量'
    )
    
    # 网络选项
    parser.add_argument(
        '--proxy',
        default=None,
        help='代理服务器地址，如 http://127.0.0.1:8080'
    )
    parser.add_argument(
        '--user-agent',
        default=None,
        help='自定义 User-Agent'
    )
    
    # 其他
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='显示详细日志'
    )
    parser.add_argument(
        '--no-progress',
        action='store_true',
        help='不显示进度条'
    )
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 1.0.0'
    )
    
    return parser


def read_urls_from_file(filepath: str, url_field: str = 'url') -> List[str]:
    """
    从文件读取 URL 列表
    
    支持格式:
    - JSON 列表: ["url1", "url2", ...]
    - JSON 对象列表: [{"url": "...", ...}, ...]
    - 纯文本: 每行一个 URL
    """
    path = Path(filepath)
    
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {filepath}")
    
    content = path.read_text(encoding='utf-8').strip()
    
    # 尝试解析为 JSON
    if content.startswith('[') or content.startswith('{'):
        try:
            data = json.loads(content)
            
            # 处理列表格式
            if isinstance(data, list):
                urls = []
                for item in data:
                    if isinstance(item, str):
                        urls.append(item)
                    elif isinstance(item, dict) and url_field in item:
                        urls.append(item[url_field])
                return urls
            
            # 处理对象格式（可能包含 URL）
            elif isinstance(data, dict):
                if url_field in data:
                    return [data[url_field]]
                # 尝试找到第一个列表值
                for key, value in data.items():
                    if isinstance(value, list):
                        urls = []
                        for item in value:
                            if isinstance(item, str):
                                urls.append(item)
                            elif isinstance(item, dict) and url_field in item:
                                urls.append(item[url_field])
                        if urls:
                            return urls
                        
        except json.JSONDecodeError:
            pass  # 不是有效的 JSON，按纯文本处理
    
    # 按纯文本处理（每行一个 URL）
    urls = []
    for line in content.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            urls.append(line)
    
    return urls


def read_urls_from_stdin(url_field: str = 'url') -> List[str]:
    """从 stdin 读取 URL 列表"""
    content = sys.stdin.read().strip()
    
    if not content:
        return []
    
    # 尝试解析为 JSON
    if content.startswith('[') or content.startswith('{'):
        try:
            data = json.loads(content)
            
            if isinstance(data, list):
                urls = []
                for item in data:
                    if isinstance(item, str):
                        urls.append(item)
                    elif isinstance(item, dict) and url_field in item:
                        urls.append(item[url_field])
                return urls
                
            elif isinstance(data, dict) and url_field in data:
                return [data[url_field]]
                
        except json.JSONDecodeError:
            pass
    
    # 按纯文本处理
    urls = []
    for line in content.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            urls.append(line)
    
    return urls


def download_images(
    urls: List[str],
    output_dir: str = './downloads',
    concurrent: int = 5,
    timeout: int = 30,
    retries: int = 3,
    proxy: Optional[str] = None,
    user_agent: Optional[str] = None,
    verbose: bool = False,
    show_progress: bool = True,
    limit: Optional[int] = None
) -> Dict[str, Any]:
    """
    批量下载图片
    
    Args:
        urls: 图片 URL 列表
        output_dir: 输出目录
        concurrent: 并发下载数
        timeout: 超时时间（秒）
        retries: 最大重试次数
        proxy: 代理地址
        user_agent: 自定义 User-Agent
        verbose: 是否显示详细日志
        show_progress: 是否显示进度条
        limit: 限制下载数量
        
    Returns:
        Dict: 下载结果报告，包含:
            - total: 总数量
            - success: 成功列表 [{url, path}, ...]
            - failed: 失败列表 [{url, error}, ...]
            - success_rate: 成功率
    """
    if not urls:
        return {
            'total': 0,
            'success': [],
            'failed': [],
            'success_rate': 0.0
        }
    
    if limit:
        urls = urls[:limit]
    
    # 设置代理环境变量
    if proxy:
        os.environ['HTTP_PROXY'] = proxy
        os.environ['HTTPS_PROXY'] = proxy
    
    # 准备请求头
    headers = None
    if user_agent:
        headers = {'User-Agent': user_agent}
    
    # 使用 ImageDownloader 下载
    downloader = ImageDownloader(
        output_dir=output_dir,
        timeout=timeout,
        max_retries=retries,
        concurrent=concurrent,
        headers=headers
    )
    
    try:
        # 注意：ImageDownloader 使用 tqdm 显示进度
        # 暂时无法直接控制进度条显示/隐藏
        results = downloader.download_batch(urls)
        
        # 构建报告
        total = len(urls)
        success_count = len(results.get('success', []))
        failed_count = len(results.get('failed', []))
        
        report = {
            'total': total,
            'success': results.get('success', []),
            'failed': results.get('failed', []),
            'success_rate': (success_count / total * 100) if total > 0 else 0.0
        }
        
        return report
        
    finally:
        downloader.close()


def print_report(report: Dict[str, Any]) -> None:
    """打印下载报告"""
    total = report.get('total', 0)
    success = len(report.get('success', []))
    failed = len(report.get('failed', []))
    rate = report.get('success_rate', 0.0)
    
    print("\n" + "=" * 50, file=sys.stderr)
    print("下载报告", file=sys.stderr)
    print("=" * 50, file=sys.stderr)
    print(f"总计:   {total} 张", file=sys.stderr)
    print(f"成功:   {success} 张", file=sys.stderr)
    print(f"失败:   {failed} 张", file=sys.stderr)
    print(f"成功率: {rate:.1f}%", file=sys.stderr)
    print("=" * 50, file=sys.stderr)


def save_report(report: Dict[str, Any], filepath: str) -> None:
    """保存下载报告到 JSON 文件"""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"报告已保存: {filepath}", file=sys.stderr)


def save_failed_urls(report: Dict[str, Any], filepath: str) -> None:
    """保存失败的 URL 到文件"""
    failed = report.get('failed', [])
    if not failed:
        return
    
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'w', encoding='utf-8') as f:
        for item in failed:
            url = item.get('url', '')
            if url:
                f.write(url + '\n')
    
    print(f"失败 URL 已保存: {filepath} ({len(failed)} 个)", file=sys.stderr)


def main():
    """主函数"""
    parser = create_parser()
    args = parser.parse_args()
    
    try:
        # 读取 URL 列表
        if args.urls_file:
            if args.verbose:
                print(f"[INFO] 从文件读取: {args.urls_file}", file=sys.stderr)
            urls = read_urls_from_file(args.urls_file, args.url_field)
        elif not sys.stdin.isatty():
            if args.verbose:
                print("[INFO] 从 stdin 读取", file=sys.stderr)
            urls = read_urls_from_stdin(args.url_field)
        else:
            print("[ERROR] 请提供 URL 文件或使用管道输入", file=sys.stderr)
            parser.print_help()
            sys.exit(1)
        
        if not urls:
            print("[ERROR] 没有找到有效的 URL", file=sys.stderr)
            sys.exit(1)
        
        if args.verbose:
            print(f"[INFO] 找到 {len(urls)} 个 URL", file=sys.stderr)
        
        # 执行下载
        report = download_images(
            urls=urls,
            output_dir=args.output_dir,
            concurrent=args.concurrent,
            timeout=args.timeout,
            retries=args.retries,
            proxy=args.proxy,
            user_agent=args.user_agent,
            verbose=args.verbose,
            show_progress=not args.no_progress,
            limit=args.limit
        )
        
        # 打印报告
        print_report(report)
        
        # 保存报告
        if args.save_report:
            save_report(report, args.save_report)
        
        # 保存失败的 URL
        if args.save_failed and report.get('failed'):
            save_failed_urls(report, args.save_failed)
        
        # 输出 JSON 结果到 stdout
        print(json.dumps(report, ensure_ascii=False))
        
        # 如果有失败，返回非零退出码
        if report.get('failed') and not report.get('success'):
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n[WARNING] 用户中断", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
