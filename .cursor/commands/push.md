# push

Commit all current changes and push them to GitHub. Do this end-to-end without asking for confirmation unless a secret or destructive action is involved.

## Steps

1. Run in parallel:
   - `git status`
   - `git diff` and `git diff --cached`
   - `git log -8 --oneline` (match recent commit style)
   - `git branch -vv` (check tracking / ahead-behind)
2. If the working tree is clean and the branch is already up to date with its remote, report that and stop.
3. Stage relevant changes with `git add -A` (include untracked files that belong to the work).
4. **Never** stage or commit secrets (`.env`, credentials, keys, tokens). Warn and skip those files if present.
5. Draft a concise 1–2 sentence commit message focused on why, matching this repo’s short style (e.g. `adjust …`, `fix …`, `add …`).
6. Commit. On Windows PowerShell use a plain `-m "message"` (no bash HEREDOC). If the commit fails due to a hook, fix the issue and create a **new** commit (do not amend unless amend rules are fully met).
7. Push the current branch to its remote (`git push -u origin HEAD` if no upstream, else `git push`).
8. Run `git status` and report: commit hash, remote URL/branch, and that the tree is clean.

## Rules

- Do **not** force-push, rebase, amend pushed commits, or rewrite history.
- Do **not** change git config.
- Stay on the current branch unless the user already asked to switch.
- If extra text was provided after `/push` (e.g. a commit message hint), prefer that for the commit message.
- Prefer committing everything that is part of the current work; do not leave unrelated dirty files unless they are secrets or clearly local-only junk the user would not want remote.
