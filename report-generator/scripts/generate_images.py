#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成构成主义报告所需的所有图片
使用PIL/Pillow生成本地图片占位符
"""

import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def create_placeholder_image(name, title, subtitle="", size=(800, 600), bg_color=(240, 240, 240), text_color=(100, 100, 100)):
    """创建占位图片"""
    
    # 创建图像
    img = Image.new('RGB', size, bg_color)
    draw = ImageDraw.Draw(img)
    
    # 尝试获取字体
    try:
        # 尝试使用系统字体
        font_title = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 36)
        font_subtitle = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 24)
        font_note = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 18)
    except:
        try:
            font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
            font_subtitle = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
            font_note = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        except:
            font_title = ImageFont.load_default()
            font_subtitle = font_title
            font_note = font_title
    
    # 绘制装饰线条（构成主义风格）
    line_color = (200, 50, 50)  # 红色
    
    # 左侧竖线
    draw.rectangle([(40, 100), (60, size[1]-100)], fill=line_color)
    
    # 底部横线
    draw.rectangle([(40, size[1]-80), (300, size[1]-60)], fill=line_color)
    
    # 绘制标题
    title_y = size[1] // 2 - 60
    draw.text((100, title_y), title, fill=text_color, font=font_title)
    
    # 绘制副标题
    if subtitle:
        draw.text((100, title_y + 60), subtitle, fill=(150, 150, 150), font=font_subtitle)
    
    # 绘制文件名
    draw.text((100, size[1] - 50), f"[{name}]", fill=(180, 180, 180), font=font_note)
    
    return img

def main(output_dir=None):
    # 创建图片目录
    if output_dir:
        images_dir = Path(output_dir)
    else:
        images_dir = Path(__file__).parent.parent / 'images'
    images_dir.mkdir(exist_ok=True)
    
    print("="*60)
    print("生成构成主义报告图片")
    print("="*60)
    
    # 定义所有需要的图片
    images_config = [
        # 第一章图片
        ("tatlin-tower", "塔特林《第三国际纪念塔》", "1919年，构成主义标志性作品"),
        ("constructivism-poster", "构成主义海报", "罗德琴科作品，几何排版风格"),
        ("modern-ui", "现代软件界面", "构成主义基因在数字时代的延续"),
        
        # 第二章图片
        ("constructivism-elements", "构成主义视觉元素", "几何、网格、色彩、动态"),
        ("grid-comparison", "网格系统对比", "1920年代排版 vs 现代CSS Grid"),
        ("tetris", "俄罗斯方块", "功能编码的极致体现"),
        
        # 第三章图片
        ("software-cases", "软件界面案例", "构成主义在当代软件设计中的延续"),
        ("figma-interface", "Figma界面", "现代版的构成主义工作台"),
        ("notion-interface", "Notion界面", "模块化设计的当代典范"),
        ("material-design", "Material Design", "构成主义的系统化工程"),
        ("windows8-ui", "Windows 8 Metro UI", "构成主义的激进实验"),
        ("case-studies", "案例合集", "不同软件产品的构成主义演绎"),
        
        # 第四章图片
        ("deep-analysis", "深度案例分析", "三个代表性产品深度剖析"),
        ("figma-components", "Figma组件系统", "模块化思想的实现"),
        ("tetris-shapes", "俄罗斯方块形状", "7种基础几何形状"),
        ("linear-interface", "Linear界面", "功能优先的极致演绎"),
        ("case-comparison", "三案例对比", "Figma / 俄罗斯方块 / Linear"),
        
        # 第五章图片
        ("methodology", "方法论框架", "构成主义软件设计方法论"),
        ("three-principles", "三大原则", "技术性、纹理性、构成性"),
        ("grid-system", "网格系统", "8pt网格系统示例"),
        ("component-system", "组件系统", "原子化设计系统示例"),
        ("motion-system", "动效系统", "功能性动效示例"),
        ("checklist", "审查清单", "设计审查工作流程"),
    ]
    
    success_count = 0
    
    for name, title, subtitle in images_config:
        output_path = images_dir / f"{name}.jpg"
        
        print(f"\n📷 生成: {name}")
        print(f"   标题: {title}")
        
        try:
            img = create_placeholder_image(name, title, subtitle)
            img.save(output_path, 'JPEG', quality=90)
            file_size = output_path.stat().st_size / 1024
            print(f"   ✅ 成功 ({file_size:.1f} KB)")
            success_count += 1
        except Exception as e:
            print(f"   ❌ 失败: {e}")
    
    print("\n" + "="*60)
    print(f"📊 统计: 成功 {success_count} / {len(images_config)}")
    print(f"📁 输出目录: {images_dir}")
    print("="*60)
    
    # 列出文件
    print("\n生成的文件列表:")
    for f in sorted(images_dir.glob("*.jpg")):
        size = f.stat().st_size / 1024
        print(f"  - {f.name:40s} ({size:6.1f} KB)")

if __name__ == '__main__':
    main()
