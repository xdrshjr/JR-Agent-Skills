# Long Term Task - Project Guide

## Project Index

This project has a pre-generated index for quick codebase understanding.

- **Location:** `.claude-index/index.md`
- **Last Updated:** 2026-02-09
- **Contents:** Project overview, feature map, file index, exported symbols, module dependencies, architecture notes

**Usage:** Read `.claude-index/index.md` to quickly understand the project structure before making changes. The index provides a navigation map of the codebase without needing to explore every file.

**Regenerate:** Say "regenerate index" or "更新索引" to update the index after major changes.

## Project Overview

This is a **Python CLI tool and SDK** for managing long-term tasks with multi-agent collaboration support. It provides:

- Task lifecycle management (create, execute, pause, resume, delete)
- Progress tracking with milestone notifications
- Multiple reporter types (file, webhook, callback, subtask)
- Process safety with file locks and atomic writes
- Fault tolerance with orphan detection and retry logic

## Architecture

The project has **two distinct modes**:

### 1. Core SDK (`src/long_term_task/`)
- Modern Python package architecture
- Tasks stored in `~/.ltt/` or custom work_dir
- CLI command: `ltt` (defined in `src/long_term_task/cli.py`)
- Recommended for production use

### 2. Legacy Dialog Mode (`long_term_task.py`, `scripts/`)
- Interactive task creation via dialog
- Tasks stored in `memory/long-term-tasks/`
- Uses question templates from `templates/`
- Separate from core SDK

## Key Files

- **Entry Points:**
  - `src/long_term_task/cli.py` - Main CLI entry point (`ltt` command)
  - `src/long_term_task/__init__.py` - SDK package exports
  - `long_term_task.py` - Legacy dialog mode entry

- **Core Modules:**
  - `manager.py` - Task CRUD operations
  - `executor.py` - Task execution engine
  - `progress.py` - Progress tracking and milestones
  - `reporter.py` - Notification abstraction layer
  - `state.py` - State management with file locking
  - `checker.py` - Orphan detection
  - `task.py` - Task data model

## Development Guidelines

### Making Changes

1. **Read the index first**: Always check `.claude-index/index.md` to understand the module structure
2. **Understand the mode**: Determine if changes affect SDK, CLI, or legacy dialog mode
3. **Check dependencies**: Refer to "Module Dependencies" section in index
4. **Test both interfaces**: Changes to core modules may affect both SDK and CLI

### Code Style

- Use type hints for function signatures
- Keep modules focused (single responsibility)
- State mutations must use `StateManager.update()` for thread safety
- All events must go through `Reporter` abstraction

### Testing

- Test SDK usage: Import from `long_term_task` package
- Test CLI usage: Run `ltt` commands via subprocess
- Test concurrency: Multiple executors should not corrupt state
- Test reporter types: File, webhook, callback, subtask

## Common Tasks

### Adding a New Event Type

1. Update `reporter.py` - Add event type constant
2. Update `executor.py` or `progress.py` - Emit the event
3. Update `state.py` - Ensure event is persisted
4. Update documentation in SKILL.md

### Adding a New CLI Command

1. Update `cli.py` - Add subparser
2. Implement handler function
3. Update `manager.py` if new task operation needed
4. Update README.md with command documentation

### Adding a New Reporter Type

1. Extend `Reporter` base class in `reporter.py`
2. Implement `report()` and `notify()` methods
3. Update `manager.py` to support new reporter_type
4. Update CLI arg parser if needed

## Integration Patterns

### Claude Code (SDK)
```python
from long_term_task import TaskManager
manager = TaskManager(work_dir="./.ltt")
task = manager.create_task(name="task", goals=["step1", "step2"])
```

### OpenClaw (CLI)
```bash
ltt create --name "task" --goals "step1,step2"
ltt exec <task_id> --step
ltt check <task_id> --json
```

## Notes

- The core SDK is stable and production-ready
- Legacy dialog mode (`long_term_task.py`) is maintained for backward compatibility
- State files use file locking to support concurrent access
- All reporters emit the same event types (consistent interface)
