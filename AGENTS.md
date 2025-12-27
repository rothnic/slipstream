# Slipstream Agent Configuration

## Project Overview
Terminal AI assistant built on OpenCode. Provides Warp-like AI experience through oh-my-zsh integration.

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **Implementation Plan** | [.gemini/brain/.../implementation_plan.md] | Detailed technical design |
| **Tech Stack** | [docs/tech-stack.md](docs/tech-stack.md) | Dependencies and rationale |
| **Research Tasks** | [docs/research.md](docs/research.md) | Open questions to resolve |
| **Development Phases** | [docs/phases.md](docs/phases.md) | Phased roadmap with gates |

## Architecture

```
Terminal → slip CLI → OpenCode Server → AI Agent
              ↓              ↓
         oh-my-zsh      Background
           plugin        daemon
```

## Agents

| Agent | Purpose |
|-------|---------|
| `slipstream` | Primary terminal assistant |
| `slipstream/learner` | Updates skills on session.idle |
| `slipstream/crawl` | Summarizes directories |
| `slipstream/mcp` | Manages MCP servers |

## Quick Commands

```bash
slip "help with git"       # Natural language
slip --model gpt-4o "..."  # Specific model
slip session list          # List sessions
slip skill list            # List skills
/fix                       # Fix last command
```

## Development

```bash
bun install
bun run dev                # Watch mode
bun run build              # Build CLI
```

## See Also

- [OpenCode Docs](https://opencode.ai/docs)
- [Plugin Template](https://github.com/zenobi-us/opencode-plugin-template)
