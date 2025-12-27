---
description: Review recent git changes
subtask: true
---

**Recent commits:**
!`git log --oneline -10`

**Changed files:**
!`git diff --name-only HEAD~5 2>/dev/null || git diff --name-only`

**Current status:**
!`git status --short`

Review these changes and:
1. Summarize what was done
2. Note any potential issues
3. Suggest improvements if needed
