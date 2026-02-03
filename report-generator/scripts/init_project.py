#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
研究报告项目初始化脚本
"""

import argparse
import os
from pathlib import Path

CHAPTER_TEMPLATE = """# 第{chapter_num}章 {title}

## {chapter_num}.1 章节概述

（在此填写本章的核心内容概述）

![章节配图](images/chapter{chapter_num}-cover.jpg)
*图{chapter_num}-1：章节配图说明*

## {chapter_num}.2 主要内容

### 子标题1

内容正文...

### 子标题2

内容正文...

| 对比项 | 项目A | 项目B |
|-------|------|------|
| 特征1 | 值1 | 值2 |
| 特征2 | 值3 | 值4 |

## {chapter_num}.3 案例分析

案例说明...

```python
# 代码示例
print("Hello World")
```

## {chapter_num}.4 小结

本章总结...

---

## 参考文献

1. 作者. (年份). *标题*. 出版社.
"""

def create_project(name, chapters=5):
    """创建研究报告项目结构"""
    
    base_dir = Path.cwd() / name
    
    # 创建目录结构
    dirs = [
        base_dir / "chapters",
        base_dir / "images",
        base_dir / "references",
        base_dir / "scripts",
    ]
    
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        print(f"📁 创建目录: {d}")
    
    # 生成章节文件
    for i in range(1, chapters + 1):
        chapter_file = base_dir / "chapters" / f"{i:02d}_章节{i}.md"
        content = CHAPTER_TEMPLATE.format(chapter_num=i, title=f"章节标题{i}")
        chapter_file.write_text(content, encoding='utf-8')
        print(f"📝 生成章节: {chapter_file.name}")
    
    # 生成参考文献模板
    refs_file = base_dir / "references" / "参考文献.md"
    refs_file.write_text("# 参考文献\n\n1. 作者. (年份). *标题*. 出版社.\n", encoding='utf-8')
    print(f"📚 生成参考文献模板")
    
    # 生成README
    readme = base_dir / "README.md"
    readme.write_text(f"""# {name}

## 项目结构

```
{name}/
├── chapters/       # 章节Markdown文件
├── images/         # 图片资源
├── references/     # 参考文献
└── scripts/        # 工具脚本
```

## 生成Word文档

```bash
python3 scripts/md_to_word.py
```
""", encoding='utf-8')
    
    print(f"\n✅ 项目初始化完成: {base_dir}")
    print(f"   章节数: {chapters}")
    return base_dir

def setup_references(base_dir, topic):
    """设置参考文献"""
    if not topic:
        return
    
    try:
        # 尝试导入并生成参考文献
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        from manage_references import ReferenceManager, load_preset_references
        
        manager = ReferenceManager(output_file=base_dir / "references" / "参考文献.md")
        presets = load_preset_references(topic)
        
        for preset in presets:
            ref_type = preset.pop("type")
            manager.add_reference(ref_type, **preset)
        
        manager.save()
        print(f"📚 已生成{topic}主题参考文献: {len(presets)}条")
        
    except Exception as e:
        print(f"⚠️ 参考文献生成失败: {e}")
        # 回退到空白模板
        refs_file = base_dir / "references" / "参考文献.md"
        refs_file.write_text("# 参考文献\n\n1. 作者. (年份). *标题*. 出版社.\n", encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description="初始化研究报告项目")
    parser.add_argument("--name", "-n", required=True, help="项目名称")
    parser.add_argument("--chapters", "-c", type=int, default=5, help="章节数量")
    parser.add_argument("--topic", "-t", default="", help="参考文献主题(构成主义/设计系统/通用)")
    parser.add_argument("--images", "-i", action="store_true", help="同时生成占位图片")
    
    args = parser.parse_args()
    base_dir = create_project(args.name, args.chapters)
    
    # 生成参考文献
    if args.topic:
        setup_references(base_dir, args.topic)
    
    # 生成占位图片
    if args.images:
        try:
            import sys
            sys.path.insert(0, str(Path(__file__).parent))
            from generate_images import main as gen_images
            gen_images(output_dir=base_dir / "images")
        except Exception as e:
            print(f"⚠️ 图片生成失败: {e}")
    
    print(f"\n✅ 项目初始化完成: {base_dir}")
    print(f"   章节数: {args.chapters}")
    if args.topic:
        print(f"   参考文献主题: {args.topic}")
    if args.images:
        print(f"   已生成占位图片")

if __name__ == "__main__":
    main()
