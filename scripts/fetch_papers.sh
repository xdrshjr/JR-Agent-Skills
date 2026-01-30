#!/bin/bash
#
# paper-daily: Fetch daily AI papers from arXiv
# Usage: ./fetch_papers.sh [count]

# 配置
CATEGORY="cs.AI"
DEFAULT_COUNT=10
COUNT=${1:-$DEFAULT_COUNT}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 正在获取今日 AI 论文...${NC}"
echo ""

# 获取论文列表（使用 arXiv API）
# 注意：由于 arXiv API 返回 XML，这里简化处理，使用备用方案

# 备用方案：从 arXiv 列表页面获取
PAPERS=$(curl -s "https://arxiv.org/list/cs.AI/recent" | grep -o 'arXiv:[0-9.]\+' | head -$COUNT | sed 's/arXiv://')

if [ -z "$PAPERS" ]; then
    echo -e "${RED}❌ 获取失败，请检查网络连接${NC}"
    exit 1
fi

# 输出日期
echo -e "${YELLOW}📅 $(date '+%Y年%m月%d日')${NC}"
echo ""

# 遍历每篇论文
INDEX=1
for PAPER_ID in $PAPERS; do
    echo -e "${GREEN}[$INDEX]${NC} 正在获取论文 $PAPER_ID ..."
    
    # 获取论文详情
    PAPER_INFO=$(curl -s "https://arxiv.org/abs/$PAPER_ID" 2>/dev/null)
    
    # 提取标题
    TITLE=$(echo "$PAPER_INFO" | grep -o '<h1 class="title mathjax">[^<]*</h1>' | sed 's/<[^>]*>//g' | sed 's/Title://g' | head -1)
    
    # 提取作者
    AUTHORS=$(echo "$PAPER_INFO" | grep -o '<div class="authors">.*</div>' | sed 's/<[^>]*>//g' | sed 's/Authors://g' | head -c 100)
    
    # 提取摘要（简化）
    ABSTRACT=$(echo "$PAPER_INFO" | grep -o '<blockquote class="abstract mathjax">.*</blockquote>' | sed 's/<[^>]*>//g' | sed 's/Abstract://g' | head -c 200)
    
    if [ -n "$TITLE" ]; then
        echo ""
        echo "📄 $TITLE"
        echo "   👤 $AUTHORS..."
        echo "   📝 $ABSTRACT..."
        echo "   🔗 https://arxiv.org/abs/$PAPER_ID"
        echo ""
    fi
    
    INDEX=$((INDEX + 1))
    
    # 避免请求过快
    sleep 0.5
done

echo -e "${BLUE}✅ 共获取 $((INDEX - 1)) 篇论文${NC}"
