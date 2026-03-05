---
allowed-tools: Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(gh pr create:*)
description: Create a pull request from the current feature branch targeting develop
---

## Context

- Current branch: !`git branch --show-current`
- Commits ahead of develop: !`git log origin/develop..HEAD --oneline`
- Diff vs develop: !`git diff origin/develop...HEAD --stat`

## Your task

Create a GitHub pull request from the current branch targeting `develop`.

The PR should follow this structure:

**Title:** A concise summary of what this branch does (conventional commit style if applicable)

**Body:**
```
## Summary
<1-3 sentences describing what changed and why>

## Changes
<bullet list of the key changes>
```

Rules:
- Target branch is always `develop`, never `main`
- Do not add reviewers, labels, or assignees
- Run `gh pr create --base develop --title "<title>" --body "<body>"` to open the PR
- Do not output anything besides the tool call
