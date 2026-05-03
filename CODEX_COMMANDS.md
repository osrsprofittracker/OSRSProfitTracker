# Codex Command Shortcuts

Use these phrases in this repo to mirror your old `.claude/commands` flow.

## 1) Branch

Say:

`create a branch off origin/Develop for <short purpose>`

Codex behavior:
- Propose a branch name in kebab-case
- Use prefix `feat/`, `fix/`, `refactor/`, or `chore/` based on intent
- Confirm the name with you
- Run: `git checkout -b <branch-name> origin/Develop`

Examples:
- `create a branch off origin/Develop for milestone modal fixes`
- `create a branch off origin/Develop for table sorting refactor`

## 2) Commit

Say:

`stage and commit with a conventional message`

Codex behavior:
- Review `git status` and diff
- Stage changed/new files
- Create one conventional commit:
  - Format: `<type>(<scope>): <short description>`
  - Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`
  - Subject under 72 chars
  - Present tense
  - Scope matches changed area (`stocks`, `modals`, `hooks`, `ui`, etc.)

Optional stricter version:

`stage and commit with a conventional message, no commit body`

## 3) PR

Say:

`open a PR to Develop`

Codex behavior:
- Use current branch as head
- Target base branch `Develop`
- Build PR title from the branch changes (conventional style when it fits)
- Use this body template:

```md
## Summary
<1-3 sentences describing what changed and why>

## Changes
- <key change 1>
- <key change 2>
```

- Do not add reviewers, labels, or assignees unless you ask

## One-shot flow

Say:

`run full git flow: branch, commit, and PR to Develop`

Codex behavior:
- Help name/create branch from `origin/Develop`
- Implement requested changes (if not already done)
- Stage + conventional commit
- Push branch
- Open PR to `Develop`
