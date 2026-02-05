"""
Google 图片爬虫 Skill - 脚本模块

提供两个主要脚本:
- crawl: 爬取 Google 图片 URL
- download: 批量下载图片

作为模块使用:
    from scripts.crawl import crawl_images
    from scripts.download import download_images
"""

from .crawl import crawl_images, main as crawl_main
from .download import download_images, main as download_main

__all__ = [
    'crawl_images',
    'crawl_main',
    'download_images', 
    'download_main',
]

__version__ = '1.0.0'
