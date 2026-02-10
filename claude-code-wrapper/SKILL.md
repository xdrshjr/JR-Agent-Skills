---
name: claude-code-wrapper
description: Simplified Claude Code CLI wrapper that automatically handles environment variables from ~/.claude/config.json. Use when the user wants to run Claude Code commands without manually exporting ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, and API_TIMEOUT_MS. Eliminates the "Not logged in" error when calling Claude Code through exec tools. Perfect for automating Claude Code tasks in OpenClaw sessions.
---

# Claude Code Wrapper

A convenience wrapper that eliminates the friction of calling Claude Code from OpenClaw sessions.

## Problem It Solves

When calling Claude Code through `exec` tools, environment variables from `~/.claude/config.json` are not automatically loaded, resulting in "Not logged in" errors. This wrapper:

1. **Auto-loads credentials** from `~/.claude/config.json`
2. **Exports required env vars** automatically
3. **Provides seamless execution** without manual setup

## Usage

### Basic Usage

Use the wrapper script directly:

```bash
bash pty:true command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Your prompt here'"
```

### With Working Directory

```bash
bash pty:true workdir:~/myproject command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Analyze this codebase'"
```

### Background Mode

```bash
bash pty:true workdir:~/myproject background:true command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Run tests'"
```

## Required Parameters

- **`pty:true`** — Claude Code is an interactive TUI application and requires pseudo-terminal mode
- **Timeout** — Recommend `timeout:120` or longer for complex tasks

## Environment Variables Auto-Loaded

The wrapper reads and exports these from `~/.claude/config.json`:

- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_BASE_URL`
- `API_TIMEOUT_MS`

## Example Workflows

### One-shot Code Generation

```bash
bash pty:true command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Write a Python function to calculate Fibonacci numbers'"
```

### Project Analysis

```bash
bash pty:true workdir:~/myproject timeout:180 command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Review the architecture of this project and suggest improvements'"
```

### Background Task with Monitoring

```bash
# Start background session
bash pty:true workdir:~/myproject background:true command:"~/.openclaw/skills/claude-code-wrapper/scripts/claude_code.sh 'Refactor the auth module'"

# Monitor progress
process action:log sessionId:XXX

# Kill when done
process action:kill sessionId:XXX
```

## Prerequisites

1. Claude Code installed (`claude` command available)
2. Claude Code configured (`~/.claude/config.json` exists with valid credentials)
3. User has previously logged in to Claude Code manually

## Error Handling

- **Config not found**: Script exits with error message if `~/.claude/config.json` is missing
- **Claude not installed**: Script exits with error message if `claude` command not found
- **Invalid token**: Claude Code itself will report authentication errors

## Notes

- This wrapper does NOT handle the "trust this directory" interactive prompt. For new directories, Claude Code may still ask for confirmation.
- For fully automated workflows, consider running Claude Code once manually in target directories to establish trust.
