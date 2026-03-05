---
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*)
description: Create and switch to a new feature branch off Develop
---

## Context

- Current branch: !`git branch --show-current`
- Latest develop: !`git fetch origin Develop 2>&1 && git log origin/Develop --oneline -5`

## Your task

Ask the user what the branch should be called, then create and switch to a new branch based off `origin/Develop`.

Branch naming rules:
- Use kebab-case (e.g. `fix-profit-calculation`, `feat-milestone-modal`)
- Prefix with `feat/`, `fix/`, `refactor/`, or `chore/` based on intent
- Keep it short and descriptive

Steps:
1. Ask the user for a short description of what the branch is for
2. Suggest a branch name following the naming rules above
3. Confirm with the user before creating
4. Run `git checkout -b <branch-name> origin/Develop`
