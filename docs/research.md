# Slipstream Research Tasks

> [!WARNING]
> Complete these before finalizing implementation decisions.

## Priority Order

1. **CLI Latency** - Determines CLI vs SDK approach
2. **Session.idle Behavior** - Determines learning trigger
3. **Commands with Shell** - Determines /fix implementation
4. **Skill Auto-Discovery** - Confirms skill-based learning

---

## R1: CLI vs SDK Latency

**Question:** Is `opencode run --attach` fast enough for interactive use?

**Test Script:**
```bash
#!/bin/bash
# research/test-cli-latency.sh

# Start server
opencode serve --port 4096 &
sleep 3

# Test attachment latency
for i in {1..5}; do
  time opencode run --attach http://localhost:4096 "echo test $i" 2>&1 | grep real
done

# Cleanup
pkill -f "opencode serve"
```

**Expected Outcome:**
- If latency < 200ms: Use CLI approach ✓
- If latency > 500ms: Consider SDK with session reuse

**Gate:** Must complete before Phase 2 implementation

---

## R2: Session.idle Event Behavior

**Question:** When does session.idle fire? Is it reliable for learning?

**Test Plugin:**
```typescript
// research/test-idle-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const TestIdlePlugin: Plugin = async () => ({
  "session.idle": async (event) => {
    console.log("IDLE EVENT:", new Date().toISOString())
    console.log("Session:", event.properties?.sessionID)
  },
})
```

**Test Steps:**
1. Install plugin
2. Start opencode session
3. Send prompt, wait for response
4. Stop interacting - time until idle event fires
5. Repeat 3x to verify consistency

**Expected Outcome:**
- Idle fires within 30s of last response: Use for learning ✓
- Idle inconsistent: Use session.compacting instead

**Gate:** Must complete before learner plugin design

---

## R3: Commands with Shell Output

**Question:** Can commands embed shell output via `!command`?

**Test:**
```bash
# Create test command
mkdir -p ~/.opencode/command
cat > ~/.opencode/command/test-shell.md << 'EOF'
---
description: Test shell injection
---
Current directory: !`pwd`
Last command: !`fc -ln -1`
EOF

# Run
opencode run --command test-shell
```

**Expected Outcome:**
- Shell output appears in prompt: Use commands for /fix ✓
- Shell output not working: Use custom tool approach

**Gate:** Must complete before /fix command implementation

---

## R4: Skill Auto-Discovery

**Question:** Does OpenCode discover new skills without restart?

**Test:**
```bash
# Create skill
mkdir -p ~/.opencode/skill/test-skill
cat > ~/.opencode/skill/test-skill/SKILL.md << 'EOF'
---
name: test-skill
description: Test auto-discovery
---
This skill was just created.
EOF

# Immediately test (no restart)
opencode run "load the test-skill skill and summarize it"
```

**Expected Outcome:**
- Skill loads without restart: Skills are dynamic ✓
- Skill not found: Need to restart opencode or use file watch

**Gate:** Must complete before learner writes skills

---

## R5: gum/fzf Availability

**Question:** What interactive tools are available on the target system?

**Test Script:**
```bash
#!/bin/bash
# research/check-interactive-tools.sh

echo "=== Interactive Tools Check ==="
echo -n "gum: "
which gum && gum --version || echo "NOT FOUND"

echo -n "fzf: "
which fzf && fzf --version || echo "NOT FOUND"

echo -n "zoxide: "
which zoxide && zoxide --version || echo "NOT FOUND"
```

**Outcome:**
- gum available: Use gum for all interactive UI
- Only fzf: Use fzf with wrapper functions
- Neither: Prompt-based fallback (no interactive selection)

**Gate:** Informs custom tool implementation

---

## Research Tracking

| ID | Status | Result | Gate For |
|----|--------|--------|----------|
| R1 | ⏳ TODO | - | Phase 2 |
| R2 | ⏳ TODO | - | Learner plugin |
| R3 | ⏳ TODO | - | /fix command |
| R4 | ⏳ TODO | - | Learner output |
| R5 | ⏳ TODO | - | UI tools |
