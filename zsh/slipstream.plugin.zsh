# Slipstream oh-my-zsh plugin
# Terminal AI assistant powered by OpenCode

# Configuration
export SLIPSTREAM_CONFIG="${SLIPSTREAM_CONFIG:-$HOME/.config/opencode/slipstream}"
export SLIP_MODE="${SLIP_MODE:-command}"
export SLIP_PROMPT_MODE=0
# SLIP_SESSION is exported by the CLI after first call

# Store last failed command for /fix
export SLIP_LAST_FAILED_CMD=""
export SLIP_LAST_EXIT_CODE=0

# Main slip command wrapper
slip() {
  local output
  
  # Check if slip CLI is available
  if command -v slip &> /dev/null; then
    # Capture output to extract SLIP_SESSION
    output=$(command slip "$@" 2>&1 | tee /dev/tty)
    
    # Extract and export SLIP_SESSION if present
    local session_line=$(echo "$output" | grep -o 'SLIP_SESSION=ses_[a-zA-Z0-9]*')
    if [[ -n "$session_line" ]]; then
      export ${session_line}
    fi
  else
    # Fallback to direct opencode
    opencode run "$@"
  fi
}

# Show current status
slip-status() {
  echo "Slipstream Status:"
  echo "  Mode: $SLIP_MODE"
  if (( SLIP_PROMPT_MODE )); then
    echo "  Prompt Mode: ON (type naturally, press Enter to send)"
  else
    echo "  Prompt Mode: OFF (use '# query' prefix)"
  fi
  if [[ -n "$SLIP_SESSION" ]]; then
    echo "  Session: $SLIP_SESSION"
  else
    echo "  Session: (none - will create on first query)"
  fi
  if [[ -n "$SLIP_LAST_FAILED_CMD" ]]; then
    echo "  Last failed: $SLIP_LAST_FAILED_CMD (exit $SLIP_LAST_EXIT_CODE)"
  fi
  echo ""
  echo "Commands:"
  echo "  # <query>     Send query to AI"
  echo "  fix           Fix last failed command"
  echo "  Ctrl+Space   Toggle prompt mode"
  echo "  slip-status   Show this status"
}

# --- Mode Toggle ---

# Toggle between command and prompt mode
__slip_toggle_mode() {
  if [[ "$SLIP_PROMPT_MODE" == "1" ]]; then
    SLIP_PROMPT_MODE=0
    SLIP_MODE="command"
    zle -M "🔧 Command mode (use '# query' for AI)"
  else
    SLIP_PROMPT_MODE=1
    SLIP_MODE="prompt"
    zle -M "🤖 Prompt mode (type naturally, Enter sends to AI)"
  fi
  zle reset-prompt
}
zle -N __slip_toggle_mode
# Ctrl+Space to toggle (less likely to conflict)
bindkey '^ ' __slip_toggle_mode

# Intercept Enter key
__slip_accept_line() {
  # Check for explicit prefixes first
  case "$BUFFER" in
    '#'*)
      # Warp-style: # followed by query
      local query="${BUFFER#\#}"
      BUFFER=""
      zle redisplay
      slip "${query# }"
      return
      ;;
    '??'*)
      # Alternative prefix
      local query="${BUFFER#\?\?}"
      BUFFER=""
      zle redisplay
      slip "${query# }"
      return
      ;;
  esac
  
  # Check if in prompt mode
  if [[ "$SLIP_PROMPT_MODE" == "1" ]] && [[ -n "$BUFFER" ]]; then
    local query="$BUFFER"
    BUFFER=""
    zle redisplay
    slip "$query"
    return
  fi
  
  # Normal command - pass through to default handler
  zle .accept-line
}
zle -N accept-line __slip_accept_line

# --- Post-Command Hook ---

# Track failed commands for help
__slip_precmd() {
  SLIP_LAST_EXIT_CODE=$?
  if (( SLIP_LAST_EXIT_CODE != 0 )); then
    SLIP_LAST_FAILED_CMD="$SLIP_LAST_CMD"
  fi
}

__slip_preexec() {
  SLIP_LAST_CMD="$1"
}

# Add hooks
autoload -Uz add-zsh-hook
add-zsh-hook precmd __slip_precmd
add-zsh-hook preexec __slip_preexec

# Quick fix last failed command
fix() {
  if [[ -n "$SLIP_LAST_FAILED_CMD" ]]; then
    slip "The command '$SLIP_LAST_FAILED_CMD' failed with exit code $SLIP_LAST_EXIT_CODE. Help me fix it."
  else
    echo "No recent failed command to fix"
  fi
}

# --- Prompt Indicators ---

# Mode indicator for prompt
__slip_prompt_prefix() {
  if (( SLIP_PROMPT_MODE )); then
    echo "%F{cyan}🤖 %f"
  fi
}

# --- Command Not Found Handler ---

# Only fires when command truly doesn't exist (like "how" "what" etc)
command_not_found_handler() {
  local cmd="$1"
  shift
  local args="$*"
  local full_input="$cmd $args"
  
  # If it looks like a question or natural language, send to slip
  # Simple heuristic: if first word is a question word
  case "$cmd" in
    how|what|why|where|when|can|could|would|should|explain|help|fix|find|show|list|create|make|write)
      slip "$full_input"
      return
      ;;
  esac
  
  # Otherwise show error and offer help
  echo "zsh: command not found: $cmd" >&2
  echo "  Tip: Use '# $full_input' to ask AI for help" >&2
  return 127
}

# --- Initialization ---

# Add prompt prefix if using native zsh prompt
if [[ -z "$POWERLEVEL9K_LEFT_PROMPT_ELEMENTS" ]]; then
  PS1='$(__slip_prompt_prefix)'"${PS1}"
fi

echo "Slipstream loaded. Use '# <question>' or 'fix' after errors."
