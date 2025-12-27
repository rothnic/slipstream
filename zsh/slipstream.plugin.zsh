# Slipstream oh-my-zsh plugin
# Terminal AI assistant powered by OpenCode

# Configuration
export SLIPSTREAM_CONFIG="${SLIPSTREAM_CONFIG:-$HOME/.config/opencode/slipstream}"
export SLIP_MODE="${SLIP_MODE:-command}"
export SLIP_AUTO_DETECT="${SLIP_AUTO_DETECT:-0}"
export SLIP_PROMPT_MODE=0

# Session ID per terminal tab (uses TTY)
__slip_session_id() {
  local tty=$(tty 2>/dev/null | tr '/' '_')
  echo "slip-${tty:-$$}"
}

# Main slip command wrapper
slip() {
  local session=$(__slip_session_id)
  
  # Check if slip CLI is available
  if command -v slip &> /dev/null; then
    command slip "$@"
  else
    # Fallback to direct opencode
    opencode run \
      --session "$session" \
      --agent slipstream \
      "$@"
  fi
}

# --- Mode Toggle ---

# Toggle between command and prompt mode
__slip_toggle_mode() {
  if (( SLIP_PROMPT_MODE )); then
    SLIP_PROMPT_MODE=0
    SLIP_MODE="command"
  else
    SLIP_PROMPT_MODE=1
    SLIP_MODE="prompt"
  fi
  zle reset-prompt
}
zle -N __slip_toggle_mode
bindkey '^A^A' __slip_toggle_mode  # Ctrl+A Ctrl+A

# Intercept Enter key in prompt mode
__slip_accept_line() {
  if (( SLIP_PROMPT_MODE )) && [[ -n "$BUFFER" ]]; then
    # In prompt mode - send to slip
    local query="$BUFFER"
    BUFFER=""
    zle redisplay
    slip "$query"
  else
    # Normal mode - check for prefixes
    case "$BUFFER" in
      '#'*)
        # Warp-style: # followed by query
        local query="${BUFFER#\#}"
        BUFFER=""
        zle redisplay
        slip "${query# }"
        ;;
      '??'*)
        # Alternative prefix
        local query="${BUFFER#\?\?}"
        BUFFER=""
        zle redisplay
        slip "${query# }"
        ;;
      *)
        # Normal command
        zle .accept-line
        ;;
    esac
  fi
}
zle -N accept-line __slip_accept_line

# --- Prompt Indicators ---

# Mode indicator for prompt
__slip_prompt_prefix() {
  if (( SLIP_PROMPT_MODE )); then
    echo "%F{cyan}🤖 %f"
  fi
}

# Model indicator
__slip_model_indicator() {
  local model="${SLIP_MODEL:-}"
  [[ -z "$model" ]] && return
  
  case "$model" in
    anthropic/claude-sonnet*) echo "⚡" ;;
    anthropic/claude-opus*)   echo "🧠" ;;
    openai/gpt-4o*)           echo "◆" ;;
    openai/o1*)               echo "○" ;;
    google/*)                 echo "◇" ;;
    *)                        echo "●" ;;
  esac
}

# --- Natural Language Detection ---

# Heuristics to detect if input looks like natural language
__slip_is_natural_language() {
  local input="$1"
  
  # Starts with question word
  [[ "$input" =~ ^(how|what|why|where|when|can|could|would|should|is|are|do|does|help|explain|fix|show|find|list|create|make|write|delete|remove)[[:space:]] ]] && return 0
  
  # Contains question mark
  [[ "$input" == *'?'* ]] && return 0
  
  # Multiple words with spaces but no path separators or flags
  [[ "$input" =~ ^[a-zA-Z]+\ [a-zA-Z]+.*$ ]] && \
    [[ "$input" != *'/'* ]] && \
    [[ "$input" != *'--'* ]] && \
    [[ "$input" != *'-'[a-zA-Z]* ]] && return 0
  
  return 1
}

# --- Command Not Found Handler ---

# Fallback for unrecognized commands
command_not_found_handler() {
  # Only use slip if it looks like natural language
  if __slip_is_natural_language "$*"; then
    slip "$*"
  else
    echo "zsh: command not found: $1" >&2
    return 127
  fi
}

# --- Initialization ---

# Add prompt prefix if using native zsh prompt
if [[ -z "$POWERLEVEL9K_LEFT_PROMPT_ELEMENTS" ]]; then
  # Not using p10k, prepend to PS1
  PS1='$(__slip_prompt_prefix)'"${PS1}"
fi

echo "Slipstream loaded. Use 'slip' or '#' prefix for AI assistance."
