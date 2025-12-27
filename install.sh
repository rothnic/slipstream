#!/bin/bash
# Slipstream Installation Script
# Installs CLI, oh-my-zsh plugin, and dependencies

set -e

echo "=== Slipstream Installation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect OS and package manager
install_gum() {
  echo "Installing gum (interactive UI)..."
  
  if command -v brew &> /dev/null; then
    brew install gum
  elif command -v apt-get &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg
    echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | sudo tee /etc/apt/sources.list.d/charm.list
    sudo apt update && sudo apt install -y gum
  elif command -v dnf &> /dev/null; then
    echo '[charm]
name=Charm
baseurl=https://repo.charm.sh/yum/
enabled=1
gpgcheck=1
gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo
    sudo dnf install -y gum
  elif command -v pacman &> /dev/null; then
    sudo pacman -S gum
  else
    echo -e "${YELLOW}⚠ Could not auto-install gum. Install manually: https://github.com/charmbracelet/gum${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ gum installed${NC}"
}

# Check for gum
if ! command -v gum &> /dev/null; then
  echo "gum not found - required for interactive UI"
  read -p "Install gum? [Y/n] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    install_gum
  else
    echo -e "${YELLOW}⚠ Skipping gum - some interactive features will be limited${NC}"
  fi
else
  echo -e "${GREEN}✓ gum already installed${NC}"
fi

# Check for opencode
if ! command -v opencode &> /dev/null; then
  echo "opencode not found - required"
  echo "Install with: npm install -g opencode-ai"
  exit 1
fi
echo -e "${GREEN}✓ opencode found${NC}"

# Create config directories
CONFIG_DIR="$HOME/.config/opencode/slipstream"
mkdir -p "$CONFIG_DIR"/{agent,cache}
mkdir -p "$HOME/.opencode/skill"
echo -e "${GREEN}✓ Config directories created${NC}"

# Install oh-my-zsh plugin
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
PLUGIN_DIR="$ZSH_CUSTOM/plugins/slipstream"

if [[ -d "$ZSH_CUSTOM" ]]; then
  mkdir -p "$PLUGIN_DIR"
  cp zsh/slipstream.plugin.zsh "$PLUGIN_DIR/"
  echo -e "${GREEN}✓ oh-my-zsh plugin installed${NC}"
  echo ""
  echo "Add 'slipstream' to your plugins in ~/.zshrc:"
  echo "  plugins=(... slipstream)"
else
  echo -e "${YELLOW}⚠ oh-my-zsh not found, skipping plugin install${NC}"
fi

# Build and link CLI
echo ""
echo "Building CLI..."
npm run build
npm link
echo -e "${GREEN}✓ CLI installed (slip command available)${NC}"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Usage:"
echo "  slip 'your prompt'      # Ask AI"
echo "  # how do I...           # Quick prompt"
echo "  Ctrl+A Ctrl+A           # Toggle prompt mode"
echo ""
