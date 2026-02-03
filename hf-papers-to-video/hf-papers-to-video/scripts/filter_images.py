#!/usr/bin/env python3
"""
Smart image filtering for paper figures
"""

import numpy as np
from PIL import Image
from pathlib import Path
import sys

WORK_DIR = Path(__file__).parent.parent
IMAGE_DIR = WORK_DIR / "images"

# Filtering parameters
MIN_WIDTH = 150
MIN_HEIGHT = 100
MAX_WIDTH = 2000
MAX_HEIGHT = 1500
MIN_CONTENT_RATIO = 0.05

def is_likely_figure(img_path):
    """
    Determine if an image is likely a paper figure (not icon/header)
    
    Returns: (is_valid, reason)
    """
    try:
        img = Image.open(img_path)
        width, height = img.size
        
        # Size checks
        if width < MIN_WIDTH or height < MIN_HEIGHT:
            return False, f"Too small ({width}x{height})"
        
        if width > MAX_WIDTH or height > MAX_HEIGHT:
            return False, f"Too large ({width}x{height})"
        
        # Content analysis
        img_array = np.array(img)
        if len(img_array.shape) == 3:
            gray = np.mean(img_array, axis=2)
        else:
            gray = img_array
        
        # Calculate content ratio (non-white/black pixels)
        total_pixels = gray.size
        non_blank = np.sum((gray < 250) & (gray > 10))
        content_ratio = non_blank / total_pixels
        
        if content_ratio < MIN_CONTENT_RATIO:
            return False, f"Too little content ({content_ratio:.1%})"
        
        # Color diversity check (filter monochrome headers)
        if len(img_array.shape) == 3:
            small = img.resize((50, 50))
            small_array = np.array(small)
            unique_colors = len(np.unique(small_array.reshape(-1, 3), axis=0))
            color_ratio = unique_colors / (50 * 50)
            
            if color_ratio < 0.05 and content_ratio < 0.3:
                return False, "Too few colors (likely icon)"
        
        return True, "Valid figure"
        
    except Exception as e:
        return False, f"Error: {e}"

def filter_images():
    """Filter all images in the images directory"""
    print("🖼️  Image Filter")
    print("=" * 50)
    
    if not IMAGE_DIR.exists():
        print(f"Images directory not found: {IMAGE_DIR}")
        return
    
    images = list(IMAGE_DIR.glob("*.png")) + list(IMAGE_DIR.glob("*.jpg"))
    
    valid_count = 0
    filtered_count = 0
    
    for img_path in images:
        is_valid, reason = is_likely_figure(img_path)
        status = "✓" if is_valid else "✗"
        print(f"{status} {img_path.name}: {reason}")
        
        if is_valid:
            valid_count += 1
        else:
            filtered_count += 1
            # Optionally rename filtered images
            # img_path.rename(img_path.with_suffix('.filtered.png'))
    
    print(f"\n📊 Results:")
    print(f"  Valid figures: {valid_count}")
    print(f"  Filtered out: {filtered_count}")
    print(f"  Total: {len(images)}")

if __name__ == "__main__":
    filter_images()
