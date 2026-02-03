#!/bin/bash
#
# paper-daily: Get detailed information of a specific paper
# Usage: ./get_paper_detail.sh <paper_id>

PAPER_ID=$1

if [ -z "$PAPER_ID" ]; then
    echo "❌ 请提供论文 ID"
    echo "用法: ./get_paper_detail.sh 2601.20856"
    exit 1
fi

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📄 正在获取论文详情...${NC}"
echo ""

# 获取论文页面
PAPER_URL="https://arxiv.org/abs/$PAPER_ID"
PAPER_INFO=$(curl -s "$PAPER_URL")

if [ -z "$PAPER_INFO" ]; then
    echo "❌ 无法获取论文信息，请检查 ID 是否正确"
    exit 1
fi

# 提取标题
TITLE=$(echo "$PAPER_INFO" | grep -o '<h1 class="title mathjax">[^<]*</h1>' | sed 's/<[^>]*>//g' | sed 's/Title://g' | head -1)

# 提取作者
AUTHORS=$(echo "$PAPER_INFO" | grep -o '<div class="authors">.*</div>' | sed 's/<[^>]*>//g' | sed 's/Authors://g' | sed 's/,/, /g')

# 提取摘要
ABSTRACT=$(echo "$PAPER_INFO" | grep -o '<blockquote class="abstract mathjax">.*</blockquote>' | sed 's/<[^>]*>//g' | sed 's/Abstract:[[:space:]]*//g' | sed 's/^[[:space:]]*//')

# 提取提交日期
DATE=$(echo "$PAPER_INFO" | grep -o 'Submitted on [0-9]\+ [A-Za-z]\+ [0-9]\+' | head -1)

# 提取分类
CATEGORIES=$(echo "$PAPER_INFO" | grep -o '<span class="primary-subject">[^<]*</span>' | sed 's/<[^>]*>//g' | head -1)

# 输出
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📌 $TITLE${NC}"
echo ""
echo "👤 作者：$AUTHORS"
echo ""
echo "📅 $DATE"
echo "🏷️ 分类：$CATEGORIES"
echo ""
echo -e "${GREEN}📝 摘要：${NC}"
echo "$ABSTRACT"
echo ""
echo "🔗 链接：$PAPER_URL"
echo "📄 PDF：https://arxiv.org/pdf/$PAPER_ID.pdf"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
