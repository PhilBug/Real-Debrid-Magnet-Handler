# Task Completion Checklist

## Before declaring a task complete:
1. Run `npm run precheck` to run lint, format, tests, and build automatically.
2. If any of the precheck part fails, fix it and run the sub-command again. Then at the end run precheck again.
3. Check git status for changed files.

## Suggested commit command format (print for user):
```bash
git commit -m 'short, descriptive message of the changes - 2 lines or less'
```

## User Rules
- Be extremely concise in all communications
- Begin messages with robot emoji 🤖
- Sacrifice grammar for conciseness
- NO "Co-authored-by" in commit messages
