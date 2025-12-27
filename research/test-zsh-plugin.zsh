#!/bin/zsh
# Test script for slipstream zsh plugin
# Run this in a new terminal to test without affecting your main shell

set -e

SCRIPT_DIR="${0:A:h}"
PROJECT_DIR="${SCRIPT_DIR:h}"

echo "=== Slipstream Zsh Integration Test ==="
echo ""
echo "This will test the plugin in isolation."
echo "Your existing zsh config will NOT be modified."
echo ""

# Create temp config directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Source the plugin manually (don't install globally)
echo "1. Sourcing plugin..."
source "$PROJECT_DIR/zsh/slipstream.plugin.zsh" 2>&1

echo ""
echo "2. Testing functions exist..."
type slip >/dev/null && echo "   ✓ slip function defined" || echo "   ✗ slip function missing"
type __slip_toggle_mode >/dev/null && echo "   ✓ __slip_toggle_mode defined" || echo "   ✗ __slip_toggle_mode missing"
type __slip_is_natural_language >/dev/null && echo "   ✓ __slip_is_natural_language defined" || echo "   ✗ __slip_is_natural_language missing"

echo ""
echo "3. Testing natural language detection..."
test_nl() {
  if __slip_is_natural_language "$1"; then
    echo "   ✓ '$1' → detected as natural language"
  else
    echo "   ✗ '$1' → NOT detected (expected: natural language)"
  fi
}

test_cmd() {
  if ! __slip_is_natural_language "$1"; then
    echo "   ✓ '$1' → detected as command"
  else
    echo "   ✗ '$1' → detected as NL (expected: command)"
  fi
}

test_nl "how do I find large files"
test_nl "what is the current directory"
test_nl "why is this failing?"
test_nl "explain git rebase"
test_nl "help me with docker"
test_cmd "ls -la"
test_cmd "git commit -m 'test'"
test_cmd "cd /tmp"
test_cmd "npm run build"
test_cmd "bun install"
test_cmd "docker compose up"
test_cmd "kubectl get pods"
test_cmd "python script.py"
test_cmd "cargo build --release"
test_cmd "./my-script.sh"

echo ""
echo "4. Testing mode toggle..."
echo "   SLIP_PROMPT_MODE before: $SLIP_PROMPT_MODE"
__slip_toggle_mode 2>/dev/null || echo "   (toggle requires ZLE, skipped)"
echo "   SLIP_PROMPT_MODE after toggle: ${SLIP_PROMPT_MODE:-0}"

echo ""
echo "5. Testing session ID generation..."
SESSION=$(__slip_session_id)
echo "   Session ID: $SESSION"
[[ "$SESSION" == slip-* ]] && echo "   ✓ Format valid" || echo "   ✗ Format invalid"

echo ""
echo "=== Tests Complete ==="
echo ""
echo "To install permanently, run:"
echo "  ./install.sh"
echo ""
echo "Or manually:"
echo "  1. cp zsh/slipstream.plugin.zsh ~/.oh-my-zsh/custom/plugins/slipstream/"
echo "  2. Add 'slipstream' to plugins=(...) in ~/.zshrc"
echo "  3. source ~/.zshrc"
