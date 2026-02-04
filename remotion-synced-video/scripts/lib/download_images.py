#!/usr/bin/env python3
"""
Download images from URLs
Usage: python3 download_images.py <urls_file> --output <directory>
"""

import os
import argparse
import requests
from urllib.parse import urlparse


def download_image(url, output_path, headers=None):
    """Download a single image"""
    if headers is None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/120.0.0.0 Safari/537.36"
        }
    
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(r.content)
            return True, len(r.content)
        return False, 0
    except Exception as e:
        return False, 0


def get_filename_from_url(url, index=None):
    """Generate filename from URL or use index"""
    parsed = urlparse(url)
    path = parsed.path
    
    if '.' in path:
        ext = path.split('.')[-1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']:
            if index is not None:
                return f"image_{index:03d}.{ext}"
            return f"image.{ext}"
    
    if index is not None:
        return f"image_{index:03d}.jpg"
    return "image.jpg"


def download_from_file(urls_file, output_dir):
    """Download multiple images from a file containing URLs"""
    os.makedirs(output_dir, exist_ok=True)
    
    with open(urls_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]
    
    success_count = 0
    
    for i, url in enumerate(urls, 1):
        filename = get_filename_from_url(url, i)
        output_path = os.path.join(output_dir, filename)
        
        success, size = download_image(url, output_path)
        
        if success:
            success_count += 1
    
    return success_count


def main():
    parser = argparse.ArgumentParser(description='Download images')
    parser.add_argument('urls_file', help='File containing image URLs')
    parser.add_argument('--output', '-o', required=True, help='Output directory')
    
    args = parser.parse_args()
    
    count = download_from_file(args.urls_file, args.output)
    print(f"Downloaded: {count}")


if __name__ == "__main__":
    main()
