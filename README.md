# Slipstream

A persistent TypeScript CLI wrapper for `@opencode-ai/sdk` that dramatically reduces latency by maintaining a background daemon with an active LLM session.

## Overview

Slipstream allows you to execute natural language terminal tasks instantly without incurring startup costs for every command. It achieves this by:

- Running a lightweight background daemon that stays warm
- Maintaining an active OpenCode session with context
- Providing a fast CLI client that connects to the daemon instantly
- Auto-terminating when idle to save system resources

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Install from Source

```bash
# Clone the repository
git clone https://github.com/rothnic/slipstream.git
cd slipstream

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### Install as Oh My Zsh Plugin

Coming soon! Slipstream will be available as an Oh My Zsh plugin for seamless integration.

## Usage

### Basic Commands

```bash
# Execute a command (automatically starts daemon if needed)
slip "list all files in the current directory"

# Start a new session (don't resume previous context)
slip --new "create a new project structure"

# Stop the daemon
slip stop

# Check daemon status
slip status
```

### Command Structure

```bash
slip [options] <prompt>
slip run [options] <prompt>
slip stop
slip status
```

### Options

- `-n, --new` - Start a new session instead of resuming the existing one
- `-h, --help` - Display help information
- `-V, --version` - Display version information

## Configuration

Slipstream stores its configuration in `~/.config/slipstream/`.

### config.json

Create or edit `~/.config/slipstream/config.json`:

```json
{
  "model": "gpt-4",
  "tools": {
    "filesystem": true,
    "shell": true,
    "browser": false,
    "gui": false
  },
  "daemon": {
    "idleTimeout": 3600,
    "port": 3000
  },
  "ui": {
    "verbose": false,
    "colorEnabled": true
  }
}
```

### Configuration Options

#### Model Settings
- `model` (string): The LLM model to use (default: "gpt-4")

#### Tool Permissions
- `tools.filesystem` (boolean): Enable file system operations (default: true)
- `tools.shell` (boolean): Enable shell command execution (default: true)
- `tools.browser` (boolean): Enable browser automation (default: false)
- `tools.gui` (boolean): Enable GUI interactions (default: false)

#### Daemon Settings
- `daemon.idleTimeout` (number): Seconds of inactivity before daemon auto-terminates (default: 3600 = 1 hour)
- `daemon.port` (number): Port for daemon to listen on (default: 3000)

#### UI Settings
- `ui.verbose` (boolean): Enable verbose debug output (default: false)
- `ui.colorEnabled` (boolean): Enable colored terminal output (default: true)

## Architecture

### Directory Structure

```
slipstream/
├── bin/
│   └── slip              # Executable entry point
├── src/
│   ├── client/           # Foreground CLI wrapper
│   │   ├── index.ts      # Main client logic
│   │   └── ui.ts         # Terminal UI components
│   ├── daemon/           # Background daemon process
│   │   ├── server.ts     # Daemon server
│   │   └── session.ts    # Session management
│   ├── config/           # Configuration handling
│   │   ├── schema.ts     # Zod schemas
│   │   └── defaults.ts   # Default configurations
│   └── utils/            # Shared utilities
│       ├── process.ts    # Process management
│       └── ipc.ts        # Inter-process communication
└── dist/                 # Compiled output
```

### How It Works

1. **Client Invocation**: When you run `slip <prompt>`, the client checks if the daemon is running
2. **Daemon Check**: Reads `~/.config/slipstream/daemon.json` to check daemon PID and health
3. **Auto-Start**: If daemon is not running, spawns it in detached mode
4. **Connection**: Connects to the daemon via localhost
5. **Session Resume**: Reuses existing session for context continuity (unless `--new` flag is used)
6. **Execution**: Streams the OpenCode response to stdout
7. **Client Exit**: Client exits immediately after streaming completes
8. **Daemon Persistence**: Daemon stays alive for future commands
9. **Auto-Cleanup**: Daemon terminates after idle timeout

## Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run TypeScript type checking
npm run typecheck

# Build the project
npm run build

# Run in development mode with watch
npm run dev
```

### Running Tests

```bash
npm test
```

### Project Scripts

- `npm run build` - Build the project with tsup
- `npm run dev` - Build in watch mode for development
- `npm test` - Run tests with vitest
- `npm run typecheck` - Run TypeScript type checking
- `npm link` - Link the CLI globally for testing

## Features

### ✅ Current Features

- Background daemon process management
- Session persistence and context continuity
- Auto-start daemon on demand
- Configurable idle timeout
- Terminal-optimized tool selection
- Beautiful CLI output with spinners and colors
- Health checking and status reporting

### 🚧 Planned Features

- Full OpenCode SDK integration
- Stream output from OpenCode execution
- Oh My Zsh plugin
- Visual mode toggling
- Permission request handling
- Enhanced error handling and recovery
- Daemon logs and debugging tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

- Built on top of [@opencode-ai/sdk](https://github.com/opencode-ai/sdk)
- Inspired by the need for instant, context-aware terminal AI assistance
