# Slipstream Testing Guide

## Prerequisites

```bash
# Ensure you're in the slipstream directory
cd /Users/nroth/workspace/slipstream

# Verify opencode is installed
opencode --version

# Verify build is current
bun run build
./bin/slip --version  # Should show 0.1.0
```

---

## 1. Unit Tests (Automated)

```bash
# Run all 27 unit tests
bun test

# Expected output: 27 pass, 0 fail
```

---

## 2. CLI Basic Tests

### 2.1 Help and Version
```bash
./bin/slip --help
./bin/slip --version
./bin/slip server --help
./bin/slip session --help
./bin/slip skill --help
./bin/slip model --help
```

### 2.2 Basic Prompt (Most Important!)
```bash
# Simple test - should get a response
./bin/slip "what is 2+2"

# With model override
./bin/slip -m anthropic/claude-sonnet-4-20250514 "hello"

# Continue previous session
./bin/slip -c "what was my last question"
```

---

## 3. Server Management Tests

```bash
# Check current status
./bin/slip server status

# If server not running, start it
./bin/slip server start

# Should show healthy
./bin/slip server status

# Stop the server
./bin/slip server stop

# Should show "No server tracked"
./bin/slip server status

# Restart
./bin/slip server start
./bin/slip server restart
```

---

## 4. Session Tests

```bash
# List sessions (requires opencode to have some sessions)
./bin/slip session list

# Attach to a specific session (use ID from list)
# ./bin/slip session attach <session-id>
```

---

## 5. Skill Management Tests

```bash
# List skills
./bin/slip skill list

# Create a test skill
./bin/slip skill create my-test-skill

# Verify it was created
./bin/slip skill list

# Show skill content
./bin/slip skill show my-test-skill

# Clean up (optional)
rm -rf ~/.opencode/skill/my-test-skill
```

---

## 6. Model Management Tests

```bash
# Show current model
./bin/slip model current

# Set a new model
./bin/slip model set anthropic/claude-sonnet-4-20250514

# Verify it changed
./bin/slip model current

# List available models (requires opencode running)
./bin/slip model list
```

---

## 7. Zsh Plugin Tests (Isolated - No Config Changes)

```bash
# Run the isolated test script (SAFE - doesn't modify your shell)
zsh research/test-zsh-plugin.zsh

# Expected: All ✓ marks, no ✗ marks
```

---

## 8. Zsh Plugin Installation (MODIFIES YOUR SHELL CONFIG)

### 8.1 Install via Script
```bash
# Run the installer
./install.sh

# This will:
# 1. Install gum if not present (prompts for confirmation)
# 2. Copy plugin to ~/.oh-my-zsh/custom/plugins/slipstream/
# 3. Copy skill templates to ~/.opencode/skill/
# 4. Build the CLI
```

### 8.2 Manual Plugin Activation
After installation, you need to manually add slipstream to your plugins:

```bash
# Edit your .zshrc
code ~/.zshrc  # or vim ~/.zshrc

# Find the plugins=(...) line and add slipstream:
# plugins=(git bun fzf slipstream)

# Reload shell config
source ~/.zshrc
```

### 8.3 Test Plugin Features
After reloading your shell:

```bash
# Test # prefix (Warp-style)
# Type this literally:
# how do I list files

# The above should trigger slip, not execute as a command

# Test toggle mode (Ctrl+A Ctrl+A)
# Press Ctrl+A then Ctrl+A again
# Your prompt should show 🤖 
# Type any text and press Enter - it goes to slip

# Toggle back with Ctrl+A Ctrl+A
```

---

## 9. Learning System Test

```bash
# First, use slip a few times to generate history
./bin/slip "list files in current directory"
./bin/slip "show git status" 
./bin/slip "what's in package.json"

# Then trigger learning
./bin/slip learn

# Check if skills were updated
./bin/slip skill show slipstream-prefs
./bin/slip skill show slipstream-aliases
./bin/slip skill show slipstream-workflows
```

---

## 10. OpenCode Commands Test

The custom commands (/fix, /explain, etc.) need to be registered with OpenCode:

```bash
# Copy config to OpenCode config directory
mkdir -p ~/.config/opencode
cp config/slipstream.jsonc ~/.config/opencode/

# Then in opencode TUI, try:
# /fix    - should analyze last failed command
# /explain ls -la   - should explain the command
# /review - should summarize git changes
```

---

## Quick Verification Checklist

```bash
# Run this one-liner to verify core functionality:
./bin/slip --version && \
./bin/slip server start && sleep 2 && \
./bin/slip server status && \
./bin/slip "say hello" && \
./bin/slip server stop && \
echo "✅ All core tests passed!"
```

---

## Troubleshooting

### "opencode: command not found"
```bash
npm install -g opencode-ai
```

### "slip: command not found" (after install)
```bash
# Ensure npm link was run
cd /Users/nroth/workspace/slipstream
bun link
# Or use full path: ./bin/slip
```

### Server won't start
```bash
# Check if port 4096 is in use
lsof -i :4096

# Kill any existing opencode processes
pkill -f "opencode serve"
```

### Plugin not loading
```bash
# Check if plugin file exists
ls ~/.oh-my-zsh/custom/plugins/slipstream/

# Check if added to plugins in .zshrc
grep "slipstream" ~/.zshrc
```
