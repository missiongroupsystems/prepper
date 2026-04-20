#!/usr/bin/env bash
# SessionStart hook: injects git snapshot + all project rules into model context.
# Emits a single JSON payload with hookSpecificOutput.additionalContext.

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

branch=$(git branch --show-current 2>/dev/null)
commits=$(git log --oneline -5 2>/dev/null)
dirty=$(git status --porcelain 2>/dev/null | head -10)
ahead=$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo 0)

rules=""
for f in .claude/rules/*.md; do
  [ -f "$f" ] || continue
  rules+="
### $(basename "$f")
$(cat "$f")
"
done

context=$(cat <<EOF
## Repo snapshot
Branch: $branch ($ahead commits ahead of origin)

Recent commits:
$commits

Uncommitted files:
${dirty:-(clean)}

## Project rules (auto-loaded from .claude/rules/)
$rules
EOF
)

node -e "
const ctx = require('fs').readFileSync(0, 'utf8');
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: ctx
  }
}));
" <<< "$context"
