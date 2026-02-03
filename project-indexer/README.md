# Project Indexer

A Claude Code skill that generates structured project indexes for quick codebase understanding in new sessions.

## Problem

Every new Claude Code session starts fresh without knowledge of your project. You end up repeatedly explaining the project structure or waiting for Claude to explore the codebase.

## Solution

Project Indexer creates a `.claude-index/` directory containing a structured map of your codebase:
- **Project Overview** - Type, languages, frameworks, entry points
- **Feature Map** - Organized by domain/feature with key exports
- **File Index** - Every file with one-line descriptions
- **Module Dependencies** - How modules relate to each other

## Usage

### Generate Index (First Time)

Say any of these to Claude Code:
- "explore the project"
- "understand the codebase"
- "generate index"
- "了解项目"
- `/project-indexer`

Claude will ask you about:
1. Directories to exclude (defaults provided)
2. Priority directories to focus on
3. Tech stack (auto-detected if not specified)

Then it generates `.claude-index/index.md` and `.claude-index/config.md`.

### Use Existing Index

In a new session, say:
- "explore the project"
- "了解项目"

Claude reads the existing index and is immediately ready to help with full project context.

### Regenerate Index

After major changes, say:
- "regenerate index"
- "更新索引"

Claude preserves your configuration and regenerates the content.

## Generated Files

```
.claude-index/
├── index.md      # Main index (project map, features, files, symbols)
└── config.md     # Configuration (exclusions, priorities, tech stack)
```

## Index Content

### Project Overview
```markdown
- **Type:** Fullstack web application
- **Languages:** TypeScript (85%), Python (15%)
- **Frameworks:** Next.js, FastAPI
- **Entry Points:** src/app/page.tsx, api/main.py
```

### Feature Map
```markdown
### Authentication (`src/auth/`)
Entry: `src/auth/index.ts`
- User authentication, session management, authorization
- **Key exports:**
  - `login(credentials): Promise<User>` - Authenticate user
  - `useAuth(): AuthContext` - React hook for auth state
```

### File Index
```markdown
| File | Description |
|------|-------------|
| login.ts | Login logic and credential validation |
| session.ts | Session storage and refresh tokens |
```

## Language Support

**Full Support:** JavaScript, TypeScript, Python

**Best-Effort:** Java, Kotlin, Go, Rust, C/C++, C#, Ruby, PHP

**Fallback:** Unknown types included in file list without symbol extraction

## Configuration

The `config.md` file stores your preferences:

```markdown
## Excluded Directories
- node_modules
- .git
- dist

## Priority Directories
- src/
- lib/

## Tech Stack
- Frontend: Next.js
- Backend: FastAPI
```

## Git Handling

After generation, you can:
- **Add to .gitignore** - Keep index local to each developer
- **Commit to repo** - Share index with team members

## Tips

1. **Regenerate after refactoring** - Keep index in sync with major changes
2. **Use with CLAUDE.md** - Index provides structure; CLAUDE.md provides conventions
3. **Customize exclusions** - Add project-specific directories to exclude
4. **Set priorities** - Focus indexing on your most important code

## License

MIT
