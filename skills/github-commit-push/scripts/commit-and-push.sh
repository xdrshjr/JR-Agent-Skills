#!/bin/bash

# GitHub Commit & Push 脚本
# 用法: ./commit-and-push.sh "commit message" [branch] [remote-url]

set -e

COMMIT_MSG="${1:-Update files}"
BRANCH="${2:-main}"
REMOTE_URL="${3:-}"

echo "🚀 GitHub Commit & Push"
echo "======================"

# 1. 检查是否在 git 仓库
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 当前目录不是 git 仓库"
    exit 1
fi

# 2. 检查远程仓库
if ! git remote -v > /dev/null 2>&1 || [ -z "$(git remote)" ]; then
    if [ -z "$REMOTE_URL" ]; then
        echo "❌ 未配置远程仓库，请提供仓库 URL"
        echo "用法: $0 'commit msg' branch 'git@github.com:user/repo.git'"
        exit 1
    fi
    echo "🔗 添加远程仓库..."
    git remote add origin "$REMOTE_URL"
fi

echo "📍 当前分支: $(git branch --show-current)"
echo "🌐 远程仓库: $(git remote get-url origin)"

# 3. 检查是否有变更
if git diff --cached --quiet && git diff --quiet; then
    echo "⚠️  没有要提交的变更"
    exit 0
fi

# 4. 显示将要提交的文件
echo ""
echo "📁 变更文件:"
git status --short

# 5. 添加所有变更
echo ""
echo "➕ 添加文件..."
git add -A

# 6. 提交
echo ""
echo "💾 提交更改..."
git commit -m "$COMMIT_MSG"
echo "✅ 提交成功"
echo "📝 提交信息: $COMMIT_MSG"

# 7. 获取远程更新
echo ""
echo "📥 获取远程更新..."
git fetch origin 2>/dev/null || {
    echo "⚠️  无法获取远程更新，尝试直接推送..."
}

# 8. 检查是否需要合并
if git rev-parse origin/$BRANCH > /dev/null 2>&1; then
    LOCAL=$(git rev-parse @ 2>/dev/null || echo "null")
    REMOTE=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "null")
    
    if [ "$LOCAL" != "null" ] && [ "$REMOTE" != "null" ] && [ "$LOCAL" != "$REMOTE" ]; then
        echo "🔀 需要合并远程更改..."
        if git merge-base --is-ancestor origin/$BRANCH HEAD 2>/dev/null; then
            echo "⚡ 本地领先远程，直接推送"
        else
            echo "🔀 合并远程更改..."
            git pull origin $BRANCH --allow-unrelated-histories --no-rebase || {
                echo ""
                echo "❌ 合并冲突，请手动解决后重试"
                echo "解决冲突后运行: git add . && git commit -m 'merge: resolve conflicts'"
                exit 1
            }
        fi
    fi
fi

# 9. 推送到 SSH（如果当前是 HTTPS）
CURRENT_URL=$(git remote get-url origin)
if [[ "$CURRENT_URL" == https://github.com/* ]]; then
    SSH_URL="git@github.com:${CURRENT_URL#https://github.com/}"
    echo ""
    echo "🔐 切换到 SSH 方式..."
    git remote set-url origin "$SSH_URL"
    echo "📝 SSH URL: $SSH_URL"
fi

# 10. 推送
echo ""
echo "📤 推送到远程..."
git push origin $BRANCH
echo ""
echo "✅ 推送成功！"

# 11. 显示仓库链接
REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
echo "🔗 查看仓库: $REPO_URL"
echo "📊 最新提交:"
git log --oneline -1