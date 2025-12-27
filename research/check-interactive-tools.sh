#!/bin/bash
# R5: Check interactive tools availability

echo "=== R5: Interactive Tools Check ==="
echo ""

echo -n "gum: "
if command -v gum &> /dev/null; then
  gum --version
  GUM_AVAILABLE=1
else
  echo "NOT FOUND"
  GUM_AVAILABLE=0
fi

echo -n "fzf: "
if command -v fzf &> /dev/null; then
  fzf --version | head -1
  FZF_AVAILABLE=1
else
  echo "NOT FOUND"
  FZF_AVAILABLE=0
fi

echo -n "zoxide: "
if command -v zoxide &> /dev/null; then
  zoxide --version
  ZOXIDE_AVAILABLE=1
else
  echo "NOT FOUND"
  ZOXIDE_AVAILABLE=0
fi

echo ""
echo "=== Results ==="
if [ "$GUM_AVAILABLE" -eq 1 ]; then
  echo "✓ gum available - use for interactive UI"
  echo "R5_RESULT=gum" > research/.r5-result
elif [ "$FZF_AVAILABLE" -eq 1 ]; then
  echo "✓ fzf available - use as fallback"
  echo "R5_RESULT=fzf" > research/.r5-result
else
  echo "⚠ No interactive tools - prompt-based fallback"
  echo "R5_RESULT=prompt" > research/.r5-result
fi
