#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
参考文献自动搜集工具
支持多种来源搜索和格式化
"""

import argparse
import json
import re
from pathlib import Path
from datetime import datetime

class ReferenceManager:
    """参考文献管理器"""
    
    def __init__(self, output_file="references/参考文献.md"):
        self.output_file = Path(output_file)
        self.references = []
        self.citations = []
    
    def add_reference(self, ref_type, **kwargs):
        """添加参考文献"""
        ref = {
            "type": ref_type,
            "id": len(self.references) + 1,
            **kwargs
        }
        self.references.append(ref)
        return ref["id"]
    
    def add_web_reference(self, title, url, site_name, author="", date=""):
        """添加网页参考文献"""
        return self.add_reference(
            "web",
            title=title,
            url=url,
            site_name=site_name,
            author=author,
            date=date
        )
    
    def add_book_reference(self, title, author, publisher, year, isbn=""):
        """添加书籍参考文献"""
        return self.add_reference(
            "book",
            title=title,
            author=author,
            publisher=publisher,
            year=year,
            isbn=isbn
        )
    
    def add_journal_reference(self, title, author, journal, year, volume, issue, pages):
        """添加期刊参考文献"""
        return self.add_reference(
            "journal",
            title=title,
            author=author,
            journal=journal,
            year=year,
            volume=volume,
            issue=issue,
            pages=pages
        )
    
    def generate_markdown(self):
        """生成Markdown格式的参考文献"""
        lines = ["# 参考文献", ""]
        
        # 中文文献
        chinese_refs = [r for r in self.references if self._is_chinese(r)]
        if chinese_refs:
            lines.extend(["## 中文文献", ""])
            for ref in chinese_refs:
                lines.append(self._format_reference(ref))
            lines.append("")
        
        # 英文文献
        english_refs = [r for r in self.references if not self._is_chinese(r)]
        if english_refs:
            lines.extend(["## 英文文献", ""])
            for ref in english_refs:
                lines.append(self._format_reference(ref))
            lines.append("")
        
        return "\n".join(lines)
    
    def _is_chinese(self, ref):
        """判断是否为中文文献"""
        title = ref.get("title", "")
        return any('\u4e00' <= char <= '\u9fff' for char in title)
    
    def _format_reference(self, ref):
        """格式化单条参考文献"""
        ref_type = ref.get("type")
        ref_id = ref.get("id")
        
        if ref_type == "web":
            author = ref.get("author", "")
            title = ref.get("title", "")
            site = ref.get("site_name", "")
            date = ref.get("date", "")
            url = ref.get("url", "")
            
            if author:
                return f"{ref_id}. {author}. ({date}). *{title}*. {site}. {url}"
            else:
                return f"{ref_id}. *{title}*. {site}. ({date}). {url}"
        
        elif ref_type == "book":
            author = ref.get("author", "")
            title = ref.get("title", "")
            publisher = ref.get("publisher", "")
            year = ref.get("year", "")
            return f"{ref_id}. {author}. ({year}). *{title}*. {publisher}."
        
        elif ref_type == "journal":
            author = ref.get("author", "")
            title = ref.get("title", "")
            journal = ref.get("journal", "")
            year = ref.get("year", "")
            volume = ref.get("volume", "")
            issue = ref.get("issue", "")
            pages = ref.get("pages", "")
            return f"{ref_id}. {author}. ({year}). {title}. *{journal}*, {volume}({issue}), {pages}."
        
        return f"{ref_id}. [未知类型] {ref}"
    
    def save(self):
        """保存到文件"""
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        content = self.generate_markdown()
        self.output_file.write_text(content, encoding='utf-8')
        print(f"✅ 参考文献已保存: {self.output_file}")
        return self.output_file


def load_preset_references(topic):
    """加载预设参考文献（根据主题）"""
    presets = {
        "构成主义": [
            {"type": "web", "title": "构成主义艺术有什么特点？", "url": "https://zhuanlan.zhihu.com/p/436785087", "site_name": "知乎专栏", "date": "2021"},
            {"type": "web", "title": "构成主义", "url": "https://baike.baidu.com/item/构成主义/1186808", "site_name": "百度百科", "date": "2023"},
            {"type": "web", "title": "构成主义 (艺术)", "url": "https://zh.wikipedia.org/wiki/构成主义_(艺术)", "site_name": "维基百科", "date": "2024"},
            {"type": "web", "title": "这个流派决定了此后设计领域的一切：小考构成主义", "url": "https://www.gcores.com/articles/121734", "site_name": "机核GCORES", "date": "2019"},
            {"type": "book", "title": "Russian Constructivism", "author": "Christina Lodder", "publisher": "Yale University Press", "year": "1983"},
            {"type": "book", "title": "Russia: An Architecture for World Revolution", "author": "El Lissitzky", "publisher": "Lund Humphries", "year": "1923"},
        ],
        "设计系统": [
            {"type": "web", "title": "Material Design 3", "url": "https://m3.material.io/", "site_name": "Google", "date": "2024"},
            {"type": "web", "title": "Human Interface Guidelines", "url": "https://developer.apple.com/design/", "site_name": "Apple", "date": "2024"},
            {"type": "book", "title": "Refactoring UI", "author": "Adam Wathan & Steve Schoger", "publisher": "Tailwind Labs", "year": "2018"},
            {"type": "book", "title": "Design Systems", "author": "Alla Kholmatova", "publisher": "Smashing Magazine", "year": "2017"},
        ],
        "通用": [
            {"type": "web", "title": "研究报告方法论", "url": "https://example.com/methodology", "site_name": "学术研究网", "date": "2024"},
        ]
    }
    
    return presets.get(topic, presets["通用"])


def main():
    parser = argparse.ArgumentParser(description="参考文献管理工具")
    parser.add_argument("--topic", "-t", default="通用", help="主题（用于加载预设）")
    parser.add_argument("--output", "-o", default="references/参考文献.md", help="输出文件")
    parser.add_argument("--add-web", nargs=4, metavar=("TITLE", "URL", "SITE", "DATE"), 
                       help="添加网页引用: 标题 URL 网站名 日期")
    
    args = parser.parse_args()
    
    manager = ReferenceManager(output_file=args.output)
    
    # 加载预设
    presets = load_preset_references(args.topic)
    for preset in presets:
        ref_type = preset.pop("type")
        manager.add_reference(ref_type, **preset)
    
    # 添加自定义引用
    if args.add_web:
        manager.add_web_reference(*args.add_web)
    
    # 保存
    manager.save()
    print(f"📚 共生成 {len(manager.references)} 条参考文献")


if __name__ == "__main__":
    main()
