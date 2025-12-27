---
description: Summarize current directory
agent: slipstream/crawl
subtask: true
---

Analyze and summarize this directory.

Current location: !`pwd`

Directory contents:
!`ls -la`

Key files:
!`head -20 README.md 2>/dev/null || echo "No README"`
!`cat package.json 2>/dev/null | head -30 || echo "No package.json"`

Provide a concise summary of:
1. What this project is
2. Tech stack
3. How to get started
