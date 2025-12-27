# Slipstream 🚀

**Terminal AI assistant powered by OpenCode** — A Warp-like AI experience for your shell.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🤖 **Natural language shell assistance** — Ask questions, get commands
- 🔄 **Session persistence** — Continues where you left off per terminal tab
- 📚 **Adaptive learning** — Learns your preferences and suggests aliases
- ⚡ **Fast startup** — Background daemon for instant responses
- 🛠️ **Interactive UI** — Beautiful prompts with gum
- 🔌 **Extensible** — Custom skills, commands, and plugins

## Installation

```bash
# Clone and install
git clone https://github.com/rothnic/slipstream.git
cd slipstream
./install.sh
```

This will:
- Install `gum` (if not present) for interactive UI
- Build and link the `slip` CLI
- Install the oh-my-zsh plugin
- Copy skill templates to `~/.opencode/skill/`

## Quick Start

```bash
# Natural language prompts
slip "how do I find large files"
slip "what's my git status"

# Using # prefix (Warp-style)
# how do I compress a folder

# Toggle prompt mode
Ctrl+A Ctrl+A   # All input goes to AI

# Built-in commands
/fix            # Fix last failed command
/explain tar -xzvf  # Explain a command
/review         # Review recent git changes
/crawl          # Summarize current directory
```

## CLI Commands

```bash
# Main command
slip "your prompt"          # Ask AI
slip -n "start fresh"       # New session
slip -m gpt-4o "prompt"     # Use specific model

# Server management
slip server start           # Start background server
slip server stop            # Stop server
slip server status          # Check health
slip server restart         # Restart

# Session management
slip session list           # List sessions
slip session attach ttys001 # Open in TUI

# Skill management
slip skill list             # List skills
slip skill create my-skill  # Create new skill
slip skill show my-skill    # View skill content

# Learning
slip learn                  # Trigger learning analysis
```

## How It Works

```
Terminal → slip CLI → OpenCode Server → AI Agent
              ↓              ↓             ↓
         oh-my-zsh      Background     Skills &
           plugin        daemon       Learning
```

1. **CLI** parses input and manages sessions
2. **Background server** provides warm startup for fast responses
3. **Sessions** are bound to terminal tabs via TTY
4. **Skills** accumulate learnings over time
5. **Plugin** triggers learning on session idle

## Configuration

### Environment Variables

```bash
export SLIP_MODE="command"       # or "prompt"
export SLIP_MODEL="anthropic/claude-sonnet-4-20250514"
export OPENCODE_CONFIG="$HOME/.config/opencode/slipstream/slipstream.jsonc"
```

### Skills

Skills are markdown files in `~/.opencode/skill/`:

```markdown
---
name: slipstream-prefs
description: User preferences
---

## Tool Preferences
- Prefers bun over npm
- Uses fd instead of find
```

The agent loads these automatically and adapts behavior.

## Directory Structure

```
slipstream/
├── src/
│   ├── cli/index.ts       # brocli CLI
│   ├── server/            # Health, session management
│   ├── ui/                # Interactive utilities
│   └── commands/          # Session commands
├── plugin/
│   └── index.ts           # OpenCode plugin
├── config/
│   ├── slipstream.jsonc   # OpenCode config
│   ├── agents/            # Agent prompts
│   ├── commands/          # /fix, /explain, etc.
│   └── skills/            # Skill templates
├── zsh/
│   └── slipstream.plugin.zsh
└── install.sh
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run dev
```

## Requirements

- Node.js 18+
- [OpenCode](https://opencode.ai) installed (`npm install -g opencode-ai`)
- [gum](https://github.com/charmbracelet/gum) for interactive UI (auto-installed)
- zsh with oh-my-zsh (optional, for shell integration)

## License

MIT
