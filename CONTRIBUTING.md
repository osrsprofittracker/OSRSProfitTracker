# Contributing to OSRS Profit Tracker

Thanks for your interest in improving OSRS Profit Tracker! This document explains how to report bugs, suggest features, and understand the development workflow.

---

## Reporting Bugs

Use the [Bug Report]( ../../issues/new/choose) issue template. Please include:

- A clear description of the problem
- Steps to reproduce it
- Your browser and device
- Screenshots if applicable

Please check existing issues first to avoid duplicates.

---

## Suggesting Features

Use the [Feature Request](../../issues/new/choose) issue template. Describe the problem it solves and how you'd expect it to work. For informal ideas, use [Discussions](../../discussions) instead.

---

## Development Workflow

This project uses the following branch structure:

- `main` — stable, production code
- `dev` — active development branch
- Feature branches — branched off `dev`, named descriptively e.g. `pagination`, `alt-timers`

### Process
1. Branch off `dev` for your changes
2. Make your changes with clear commit messages
3. Open a pull request into `dev`
4. Changes are merged to `main` when stable and tested

---

## Commit Message Style

Keep commit messages short and descriptive:
```
Added pagination to trade screen
Fixed timer reset bug on alt accounts
Updated README
```

---

## Code Style

- React functional components
- CSS classes over inline styles where possible
- Keep components small and focused on a single responsibility

---

## Questions

For general questions use [Discussions](../../discussions) rather than opening an issue.

---

*This is a solo project so response times may vary. All contributions and feedback are appreciated.*