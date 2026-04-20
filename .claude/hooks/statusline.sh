#!/usr/bin/env bash
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
branch=$(git branch --show-current 2>/dev/null)
uncommitted=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
ahead=$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo 0)
icon="."
[ "$uncommitted" -gt 0 ] && icon="*"
[ "$ahead" -gt 0 ] && icon="^"
echo "[$branch $icon $uncommitted dirty, $ahead ahead]"
