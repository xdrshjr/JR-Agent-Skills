#!/usr/bin/env python3
"""
Extract papers from Hugging Face Daily Papers
"""

import requests
import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import fitz

WORK_DIR = Path(__file__).parent.parent
PDF_DIR = WORK_DIR / "pdfs"
IMAGE_DIR = WORK_DIR / "images"
OUTPUT_DIR = WORK_DIR / "output"

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

def download_pdf(arxiv_id):
    """Download PDF from arxiv.org"""
    pdf_path = PDF_DIR / f"{arxiv_id}.pdf"
    if pdf_path.exists():
        with open(pdf_path, 'rb') as f:
            if f.read(4) == b'%PDF':
                return str(pdf_path)
    
    url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=60)
        if resp.status_code == 200 and resp.content.startswith(b'%PDF'):
            with open(pdf_path, 'wb') as f:
                f.write(resp.content)
            return str(pdf_path)
    except Exception as e:
        print(f"Error downloading {arxiv_id}: {e}")
    return None

def extract_from_pdf(pdf_path):
    """Extract abstract and introduction from PDF"""
    result = {"abstract": "", "introduction": ""}
    
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page_num in range(min(5, len(doc))):
            full_text += doc[page_num].get_text()
        
        # Extract abstract
        abstract_match = re.search(
            r'Abstract[.\s]*(.+?)(?=\n\s*\n|Introduction|\d+\s+Introduction)',
            full_text, re.DOTALL | re.IGNORECASE
        )
        if abstract_match:
            result["abstract"] = abstract_match.group(1).strip()[:3000]
        
        # Extract introduction
        intro_match = re.search(
            r'(?:Introduction|1\s+Introduction)[.\s]*(.+?)(?=\n\s*\d+\s+\w|Related Work|Method)',
            full_text, re.DOTALL | re.IGNORECASE
        )
        if intro_match:
            result["introduction"] = intro_match.group(1).strip()[:8000]
        
        doc.close()
    except Exception as e:
        print(f"Error processing PDF: {e}")
    
    return result

def main():
    print("📄 HF Papers Extractor")
    print("=" * 50)
    
    # Ensure directories exist
    PDF_DIR.mkdir(exist_ok=True)
    IMAGE_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Example paper list (replace with actual HF scraping)
    papers = [
        {"title": "Example Paper 1", "arxiv_id": "2601.00001"},
        {"title": "Example Paper 2", "arxiv_id": "2601.00002"},
    ]
    
    results = []
    for paper in papers:
        print(f"\nProcessing: {paper['title']}")
        pdf_path = download_pdf(paper['arxiv_id'])
        if pdf_path:
            content = extract_from_pdf(pdf_path)
            results.append({
                **paper,
                **content,
                "pdf_path": pdf_path
            })
            print(f"  ✓ Abstract: {len(content['abstract'])} chars")
    
    # Save results
    with open(OUTPUT_DIR / "papers_data.json", 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Extracted {len(results)} papers")

if __name__ == "__main__":
    main()
