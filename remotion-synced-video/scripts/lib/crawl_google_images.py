#!/usr/bin/env python3
"""
Google Images Crawler - Extract original (non-thumbnail) image URLs
Usage: python3 crawl_google_images.py <keyword> [--count N] [--output FILE]
"""

import re
import json
import argparse
from urllib.parse import unquote
from playwright.sync_api import sync_playwright


def extract_from_imgurl_links(page):
    """Method 1: Extract original URLs from a[href*=imgurl] links"""
    links = page.eval_on_selector_all('a[href*="imgurl="]', 
        'els => els.map(e => e.href)')
    
    urls = []
    for link in links:
        match = re.search(r'imgurl=([^&]+)', link)
        if match:
            url = match.group(1)
            url = unquote(url)
            if 'gstatic' not in url and 'google' not in url and url.startswith('http'):
                if url not in urls:
                    urls.append(url)
    return urls


def extract_from_page_scripts(page):
    """Method 2: Extract from embedded JSON in page scripts"""
    html = page.content()
    pattern = r'"(https?://[^"]+\.(?:jpg|jpeg|png|webp|gif))"'
    urls = re.findall(pattern, html)
    
    original_urls = []
    for url in urls:
        url = url.replace('\\u003d', '=').replace('\\u0026', '&')
        if 'google' not in url and 'gstatic' not in url and url.startswith('http'):
            if url not in original_urls:
                original_urls.append(url)
    return original_urls


def crawl_google_images(keyword, count=10):
    """
    Crawl original images from Google Images search
    
    Args:
        keyword: Search keyword
        count: Number of images to retrieve
        
    Returns:
        List of original image URLs
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto(f"https://www.google.com/search?q={keyword}&tbm=isch", 
                  wait_until="networkidle")
        page.wait_for_timeout(3000)
        
        all_urls = []
        
        # Method 1: imgurl links
        urls = extract_from_imgurl_links(page)
        all_urls.extend(urls)
        
        # Method 2: page scripts
        urls = extract_from_page_scripts(page)
        for url in urls:
            if url not in all_urls:
                all_urls.append(url)
        
        browser.close()
        
        return all_urls[:count]


def main():
    parser = argparse.ArgumentParser(description='Crawl Google Images')
    parser.add_argument('keyword', help='Search keyword')
    parser.add_argument('--count', '-n', type=int, default=10, 
                        help='Number of images to retrieve (default: 10)')
    parser.add_argument('--output', '-o', help='Output file to save URLs')
    parser.add_argument('--json', '-j', action='store_true',
                        help='Output as JSON')
    
    args = parser.parse_args()
    
    urls = crawl_google_images(args.keyword, args.count)
    
    if args.json:
        print(json.dumps(urls))
    else:
        for url in urls:
            print(url)
    
    if args.output:
        with open(args.output, 'w') as f:
            for url in urls:
                f.write(url + '\n')


if __name__ == "__main__":
    main()
