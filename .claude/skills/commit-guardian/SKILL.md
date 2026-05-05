---
name: commit-guardian
description: |
  Git commit safety skill that requires explicit user confirmation before executing commits.
  Use this skill whenever the user asks to commit, push, or stage changes — or whenever
  a git commit operation is about to occur. This skill exists to prevent accidental commits,
  especially of coworker code or unreviewed changes. It asks confirmation questions and
  warns about potentially risky commit operations.
triggers:
  - "commit"
  - "git commit"
  - "stage and commit"
  - "commit changes"
  - "git push"
  - "stage all"
  - "git add"
  - "commit without pushing"
---

# Commit Guardian

This skill acts as a guardrail for git operations. It intercepts commit requests and:

1. Asks for explicit confirmation before proceeding
2. Checks for coworker changes that need extra scrutiny
3. Warns about potentially risky operations (force pushes, large commits, etc.)

## Workflow

### Step 1: Identify the commit scope

Run `git status` and `git diff --stat` to understand what's being committed.

### Step 2: Check for coworker changes

Before any commit, check if any files were recently modified by other authors:
```bash
git log --oneline -5
git blame [file] | head -20
```

If coworker changes are detected, flag them explicitly.

### Step 3: Request confirmation

Ask the user to confirm the commit with specific details:

- **What** files are being committed
- **Why** there's a brief commit message
- **Who** authored the changes (verify it's not unacknowledged coworker work)

### Step 4: Execute only after confirmation

Only run `git commit` after user explicitly confirms. Never auto-commit.

## Confirmation Questions

Ask these before any commit:

1. "You're about to commit X file(s): [list]. Proceed?"
2. "Commit message: '[message]'. Is this correct?"
3. If coworker changes detected: "This includes changes from [coworker name]. Have you reviewed their work?"

## Risk Flags

Warn (but don't block) for:
- Force pushes (`git push --force`)
- Large number of files (>10)
- Binary files being committed
- Sensitive data (secrets, credentials)
- Committing directly to main/master

## Anti-Patterns This Prevents

- Accidentally committing debugging code
- Committing without review
- Stealing coworker credit
- Force pushing to shared branches
- Committing secrets or credentials
