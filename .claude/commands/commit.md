---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git commit:*)
description: Stage all changes and create a conventional commit
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status`
- Full diff of all changes: !`git diff HEAD`

## Your task

Stage all changed/new files and create a single git commit with a conventional commit message that accurately describes the changes.

Conventional commit format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`

Rules:
- Keep the subject line under 72 characters
- Use present tense ("add feature" not "added feature")
- Scope should reflect the area of the codebase changed (e.g. `stocks`, `modals`, `hooks`, `ui`)
- If changes span multiple unrelated areas, use multiple commits only if they are clearly separable; otherwise use the dominant type
- Do not add a body unless the change is non-obvious

Stage and commit in a single response. Do not ask for confirmation. Do not output anything besides the tool calls.
