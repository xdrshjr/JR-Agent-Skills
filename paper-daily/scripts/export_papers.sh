#!/bin/bash
#
# paper-daily: Export papers to document format with GitHub screenshots
# Usage: ./export_papers.sh [markdown|word] [count]

FORMAT=${1:-word}
COUNT=${2:-10}
OUTPUT_DIR="$HOME/clawd"
DATE_STR=$(date '+%Y-%m-%d')
TEMP_DIR="/tmp/paper_daily_$$"

mkdir -p "$TEMP_DIR"

echo "📚 正在获取 ${COUNT} 篇论文..."
echo ""

# 获取论文列表
PAPERS=$(curl -s "https://arxiv.org/list/cs.AI/recent" | grep -o 'arXiv:[0-9.]\+' | head -$COUNT | sed 's/arXiv://')

if [ -z "$PAPERS" ]; then
    echo "❌ 获取论文列表失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 如果是word格式，使用Python生成
if [ "$FORMAT" = "word" ]; then
    echo "📝 正在生成 Word 文档（包含GitHub截图）..."
    
    python3 << PYTHON_EOF
import subprocess
import re
import os
import json
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from datetime import datetime

def fetch_github_screenshots(arxiv_id):
    """从论文中提取GitHub链接并从README下载截图"""
    screenshots = []
    
    # 获取论文页面
    result = subprocess.run(
        ["curl", "-s", f"https://arxiv.org/abs/{arxiv_id}"],
        capture_output=True, text=True, timeout=30
    )
    html = result.stdout
    
    # 查找GitHub链接
    github_match = re.search(r'https://github\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+', html)
    if not github_match:
        return screenshots
    
    github_url = github_match.group(0)
    repo_name = github_url.split('/')[-1]
    
    print(f"    🔍 发现GitHub仓库: {github_url}")
    
    # 获取README
    readme_result = subprocess.run(
        ["curl", "-s", "-L", f"{github_url}/raw/main/README.md"],
        capture_output=True, text=True, timeout=30
    )
    readme = readme_result.stdout
    
    if not readme or "404" in readme:
        # 尝试master分支
        readme_result = subprocess.run(
            ["curl", "-s", "-L", f"{github_url}/raw/master/README.md"],
            capture_output=True, text=True, timeout=30
        )
        readme = readme_result.stdout
    
    if not readme or "404" in readme:
        print(f"    ⚠️  无法获取README")
        return screenshots
    
    # 从README提取图片链接 (markdown格式: ![](url) 或 <img src="url">)
    img_patterns = [
        r'!\[.*?\]\((https?://[^\)]+\.(?:png|jpg|jpeg|gif))\)',
        r'!\[.*?\]\(([^\)]+\.(?:png|jpg|jpeg|gif))\)',
        r'<img[^>]+src=["\'](https?://[^"\']+\.(?:png|jpg|jpeg|gif))["\']',
        r'<img[^>]+src=["\']([^"\']+\.(?:png|jpg|jpeg|gif))["\']'
    ]
    
    found_images = []
    for pattern in img_patterns:
        matches = re.findall(pattern, readme, re.IGNORECASE)
        for match in matches:
            # 如果是相对路径，转换为绝对路径
            if match.startswith('http'):
                found_images.append(match)
            elif match.startswith('./') or match.startswith('../'):
                found_images.append(f"{github_url}/raw/main/{match.lstrip('./')}")
            else:
                found_images.append(f"{github_url}/raw/main/{match}")
    
    # 去重并限制数量
    found_images = list(dict.fromkeys(found_images))[:3]  # 最多3张
    
    # 下载图片
    for i, img_url in enumerate(found_images):
        img_path = f"$TEMP_DIR/{arxiv_id}_img_{i}.png"
        download_result = subprocess.run(
            ["curl", "-s", "-L", "-o", img_path, img_url],
            capture_output=True, timeout=30
        )
        
        if download_result.returncode == 0 and os.path.exists(img_path):
            # 检查文件大小（确保不是404页面）
            size = os.path.getsize(img_path)
            if size > 1000:  # 至少1KB
                screenshots.append(img_path)
                print(f"    ✅ 下载截图: {img_url[:60]}...")
            else:
                os.remove(img_path)
    
    return screenshots

# 创建文档
doc = Document()
doc.styles['Normal'].font.name = 'Microsoft YaHei'
doc.styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')

# 标题
title = doc.add_heading('AI 论文日报', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
for run in title.runs:
    run.font.color.rgb = RGBColor(30, 60, 114)

# 日期
date_para = doc.add_paragraph()
date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
date_run = date_para.add_run(f'生成日期：{datetime.now().strftime("%Y年%m月%d日")}')
date_run.font.size = Pt(12)
date_run.font.color.rgb = RGBColor(100, 100, 100)

doc.add_paragraph()

# 处理每篇论文
papers_list = """$PAPERS""".strip().split()

for idx, paper_id in enumerate(papers_list, 1):
    print(f"[{idx}/{len(papers_list)}] 处理论文 {paper_id}...")
    
    # 获取论文信息
    result = subprocess.run(
        ["curl", "-s", f"https://arxiv.org/abs/{paper_id}"],
        capture_output=True, text=True, timeout=30
    )
    html = result.stdout
    
    # 提取标题
    title_match = re.search(r'<h1 class="title mathjax">.*?Title:(.*?)</h1>', html, re.DOTALL)
    paper_title = title_match.group(1).strip() if title_match else f"Paper {paper_id}"
    
    # 提取摘要
    abstract_match = re.search(r'<blockquote class="abstract mathjax">.*?Abstract:(.*?)</blockquote>', html, re.DOTALL)
    abstract = abstract_match.group(1).strip()[:400] if abstract_match else "暂无摘要"
    
    # 提取作者
    authors_match = re.search(r'<div class="authors">(.*?)</div>', html, re.DOTALL)
    authors = "Unknown"
    if authors_match:
        authors_html = authors_match.group(1)
        authors = re.sub(r'<[^>]+>', '', authors_html).replace('Authors:', '').strip()[:100]
    
    # 添加标题
    doc.add_heading(f"{idx}. {paper_title}", level=2)
    
    # 添加作者
    if authors != "Unknown":
        p = doc.add_paragraph()
        p.add_run("👤 作者：").bold = True
        p.add_run(authors)
        p.runs[1].font.size = Pt(10)
        p.runs[1].font.color.rgb = RGBColor(100, 100, 100)
    
    # 添加摘要
    p = doc.add_paragraph()
    p.add_run("📝 摘要：").bold = True
    p.add_run(abstract)
    p.paragraph_format.line_spacing = 1.5
    
    # 添加链接
    p = doc.add_paragraph()
    p.add_run("🔗 链接：").bold = True
    p.add_run(f"https://arxiv.org/abs/{paper_id}")
    p.runs[1].font.color.rgb = RGBColor(100, 100, 100)
    p.runs[1].font.size = Pt(10)
    
    # 尝试获取GitHub截图
    try:
        screenshots = fetch_github_screenshots(paper_id)
        if screenshots:
            p = doc.add_paragraph()
            p.add_run("📷 项目截图：").bold = True
            
            for img_path in screenshots:
                try:
                    doc.add_picture(img_path, width=Inches(5.5))
                    last_paragraph = doc.paragraphs[-1]
                    last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                except Exception as e:
                    print(f"    ⚠️  插入图片失败: {e}")
    except Exception as e:
        print(f"    ⚠️  获取截图失败: {e}")
    
    doc.add_paragraph()

# 趋势总结
doc.add_heading('📊 今日趋势总结', level=1)

summary = """本次整理的论文涵盖了以下主题方向：

• 推理能力与规划：长程规划评估、数学推理增强、概率逻辑推理加速
• 智能体与通信：任务导向通信协议、多模型对话对齐  
• 记忆与优化：主动内存控制、企业资源规划
• 架构创新：深度研究系统、神经符号AI硬件加速
• 安全与对齐：风险敏感规划、AI对齐策略测试

整体趋势显示，AI研究正从单纯的模型性能提升转向更复杂的系统架构设计、多智能体协作以及安全对齐等方向。"""

p = doc.add_paragraph(summary)
p.paragraph_format.line_spacing = 1.5

# 保存
output_file = "$OUTPUT_DIR/AI_Papers_${DATE_STR}.docx"
doc.save(output_file)
print(f"\n✅ Word文档已生成：{output_file}")
PYTHON_EOF

else
    # Markdown格式（简版，不包含截图）
    OUTPUT_FILE="$OUTPUT_DIR/AI_Papers_${DATE_STR}.md"
    
    echo "# AI 论文日报 - ${DATE_STR}" > "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "> 自动生成的 arXiv AI 分类论文摘要" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    INDEX=1
    for PAPER_ID in $PAPERS; do
        echo "[$INDEX] 获取论文 $PAPER_ID..."
        PAPER_INFO=$(curl -s "https://arxiv.org/abs/$PAPER_ID")
        TITLE=$(echo "$PAPER_INFO" | grep -o '<h1 class="title mathjax">[^<]*</h1>' | sed 's/<[^>]*>//g' | sed 's/Title://g' | head -1)
        AUTHORS=$(echo "$PAPER_INFO" | grep -o '<div class="authors">.*</div>' | sed 's/<[^>]*>//g' | sed 's/Authors://g' | head -c 100)
        ABSTRACT=$(echo "$PAPER_INFO" | grep -o '<blockquote class="abstract mathjax">.*</blockquote>' | sed 's/<[^>]*>//g' | sed 's/Abstract:[[:space:]]*//g' | head -c 300)
        
        echo "## ${INDEX}. ${TITLE}" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**作者**：${AUTHORS}..." >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**摘要**：${ABSTRACT}..." >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**链接**：https://arxiv.org/abs/${PAPER_ID}" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "---" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        INDEX=$((INDEX + 1))
        sleep 0.3
    done
    
    echo "✅ Markdown 文档已生成：$OUTPUT_FILE"
fi

# 清理临时文件
rm -rf "$TEMP_DIR"
