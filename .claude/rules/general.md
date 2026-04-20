# General Rules

Apply to all code in this repository.

## Working style
- Read relevant code before editing. Propose a short plan for non-trivial work.
- Make the smallest safe change. Don't rewrite large modules unless explicitly asked.
- Don't introduce abstractions beyond what the task requires.
- After changes, summarize: changed files, commands run, result, risks / follow-ups.

## Product principles
- **Clarity, immediacy, reversibility** — no save buttons, only autosave. Respect this in new features.
- Recipes are living objects on a canvas — edits should feel direct and undoable, not form-modal-submit.

## Do not
- Never `git commit` or `git push` — the user owns all git-writing actions.
- Never introduce a "Save" button where autosave is the existing pattern.
- Never bypass cycle detection on outlet hierarchies or sub-recipe trees.
- Never leak a non-admin user into tasting sessions they don't participate in.

## Clean code baseline

- **No dead or commented-out code.** Delete it — git history is the archive.
- **Named constants over magic numbers/strings.** Timeouts, limits, retry counts, HTTP status codes, enum-like strings — give them a name.
- **Early returns over nested conditionals.** Flatten happy-path code; bail on errors and guard clauses first.
- **Don't catch errors you can't act on.** Let them propagate — a bare `except` / `catch` that only re-logs is worse than the original throw.
- **Extract on the third occurrence, not the second.** Two similar blocks are a coincidence; three are a pattern. Avoid premature abstraction.
