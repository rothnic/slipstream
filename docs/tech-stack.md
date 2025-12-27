# Slipstream Tech Stack

## Runtime & Build

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | [Bun](https://bun.sh) | Fast startup, TypeScript native, shell integration |
| **Build** | Bun build | Single binary output, fast |
| **CLI** | [brocli](https://github.com/drizzle-team/brocli) | Type-safe, subcommands, transforms |

## OpenCode Integration

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Server** | `opencode serve` | Background daemon, warm startup |
| **CLI** | `opencode run --attach` | Session continuity |
| **Plugin** | `@opencode-ai/plugin` | Event hooks, custom tools |
| **Skills** | Native SKILL.md | Auto-discovery, no custom loader |
| **Commands** | Native commands | Shell injection support |

## Shell Integration

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Shell** | zsh + oh-my-zsh | User's existing setup |
| **UI** | [gum](https://github.com/charmbracelet/gum) | Beautiful dialogs |
| **Fallback** | fzf | Widely installed |
| **Prompt** | p10k / starship | Mode indicators |

## Dependencies

### Production
```json
{
  "@drizzle-team/brocli": "^0.10.0",
  "@opencode-ai/plugin": "latest"
}
```

### Development
```json
{
  "typescript": "^5.0.0",
  "vitest": "^2.0.0",
  "@types/bun": "latest"
}
```

## File Structure

```
slipstream/
├── src/
│   ├── cli.ts              # brocli entry point
│   ├── server.ts           # OpenCode server management
│   ├── session.ts          # TTY-based session handling
│   └── commands/           # CLI subcommands
├── plugin/
│   ├── index.ts            # OpenCode plugin entry
│   └── learner.ts          # session.idle learning
├── config/
│   ├── slipstream.jsonc    # Agent definitions
│   └── agents/             # Agent prompts
├── zsh/
│   └── slipstream.plugin.zsh
└── docs/
    ├── tech-stack.md       # This file
    ├── research.md         # Open questions
    └── phases.md           # Development phases
```

## External Tools (Optional)

| Tool | Purpose | Check |
|------|---------|-------|
| gum | Interactive UI | `which gum` |
| fzf | Fallback UI | `which fzf` |
| zoxide | Frecent dirs | `zoxide query -l` |
| navi | Cheatsheets | Integration option |
