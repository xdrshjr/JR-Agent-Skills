#!/usr/bin/env python3
"""
Download images from URLs
Usage: python3 download_images.py <urls_file> --output <directory>
   or: python3 download_images.py --url <url> --output <filepath>
"""

import os
import argparse
import requests
from urllib.parse import urlparse


def download_image(url, output_path, headers=None):
    """
    Download a single image
    
    Args:
        url: Image URL
        output_path: Where to save the file
        headers: Optional request headers
        
    Returns:
        (success: bool, size_bytes: int)
    """
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
        else:
            return False, 0
    except Exception as e:
        print(f"  ❌ Error downloading {url[:50]}...: {e}")
        return False, 0


def get_filename_from_url(url, index=None):
    """Generate filename from URL or use index"""
    parsed = urlparse(url)
    path = parsed.path
    
    # Try to get extension from URL
    if '.' in path:
        ext = path.split('.')[-1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']:
            if index is not None:
                return f"image_{index:03d}.{ext}"
            return f"image.{ext}"
    
    # Default to jpg
    if index is not None:
        return f"image_{index:03d}.jpg"
    return "image.jpg"


def download_from_file(urls_file, output_dir):
    """Download multiple images from a file containing URLs"""
    os.makedirs(output_dir, exist_ok=True)
    
    with open(urls_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]
    
    print(f"📥 Downloading {len(urls)} images to {output_dir}/")
    
    success_count = 0
    total_size = 0
    
    for i, url in enumerate(urls, 1):
        filename = get_filename_from_url(url, i)
        output_path = os.path.join(output_dir, filename)
        
        print(f"  [{i}/{len(urls)}] Downloading...", end=" ")
        success, size = download_image(url, output_path)
        
        if success:
            size_kb = size / 1024
            print(f"✅ {filename} ({size_kb:.1f} KB)")
            success_count += 1
            total_size += size
        else:
            print(f"❌ Failed")
    
    print(f"\n{'='*60}")
    print(f"✅ Downloaded: {success_count}/{len(urls)} images")
    print(f"💾 Total size: {total_size/1024/1024:.2f} MB")
    print(f"📁 Saved to: {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description='Download images')
    parser.add_argument('urls_file', nargs='?', help='File containing image URLs (one per line)')
    parser.add_argument('--url', '-u', help='Single URL to download')
    parser.add_argument('--output', '-o', required=True, help='Output directory or file')
    
    args = parser.parse_args()
    
    if args.url:
        # Single URL download
        success, size = download_image(args.url, args.output)
        if success:
            print(f"✅ Downloaded: {args.output} ({size/1024:.1f} KB)")
        else:
            print(f"❌ Download failed")
    elif args.urls_file:
        # Batch download from file
        download_from_file(args.urls_file, args.output)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
