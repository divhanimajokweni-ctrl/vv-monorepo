# GitHooks - Repository Ruleset Implementation

## Overview
This directory contains local git hooks that enforce repository rules similar to GitHub rulesets.

## Installation
Hooks are auto-enabled via `.gitconfig`:
```ini
[core]
    hooksPath = .githooks
```

## Available Rules

### 1. pre-push (Force Push Protection)
- Blocks force pushes to `main` and `ubuntu-pools-v2`
- Protects branch history integrity
- Run locally before `git push`

### 2. pre-commit (Commit Validation)
- Checks for sensitive files (.env, .pem, credentials)
- Validates commit message length (subject ≤ 72 chars)
- Warns on WIP commits

### 3. commit-msg (Conventional Commits)
- Enforces [Conventional Commits](https://www.conventionalcommits.org/) format:
  - Format: `type(scope): description`
  - Types: feat, fix, docs, style, refactor, test, chore, ci, perf, build, revert
  - No periods in subject
  - Subject lowercase

## Bypass
```bash
git commit --no-verify -m "feat: ..."
git push --no-verify
```

## Protected Branches
- `main`
- `ubuntu-pools-v2`