#!/bin/bash
# Claude Code Wrapper Script
# 自动处理环境变量和交互确认

# 读取 Claude Code 配置
CONFIG_FILE="$HOME/.claude/config.json"

if [ -f "$CONFIG_FILE" ]; then
    # 提取环境变量
    ANTHROPIC_AUTH_TOKEN=$(grep -o '"ANTHROPIC_AUTH_TOKEN": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    ANTHROPIC_BASE_URL=$(grep -o '"ANTHROPIC_BASE_URL": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    API_TIMEOUT_MS=$(grep -o '"API_TIMEOUT_MS": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    
    # 导出环境变量
    export ANTHROPIC_AUTH_TOKEN
    export ANTHROPIC_BASE_URL
    export API_TIMEOUT_MS
else
    echo "Error: Claude Code config not found at $CONFIG_FILE"
    echo "Please run 'claude' manually first to set up configuration."
    exit 1
fi

# 检查 claude 命令是否存在
if ! command -v claude &> /dev/null; then
    echo "Error: 'claude' command not found. Please install Claude Code first."
    exit 1
fi

# 执行 Claude Code 命令
exec claude "$@"
