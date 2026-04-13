Run a full-stack health check by launching three sub-agents IN PARALLEL in a single message:

1. **Bash sub-agent** (subagent_type: Bash, run_in_background: true) — Backend tests:
   ```
   cd /Users/siangmeng/Documents/projects/prepper-main/backend && source venv/bin/activate && pytest --tb=short -q 2>&1
   ```

2. **Bash sub-agent** (subagent_type: Bash, run_in_background: true) — Frontend lint + build:
   ```
   cd /Users/siangmeng/Documents/projects/prepper-main/frontend && npm run lint 2>&1 && echo "---LINT OK---" && npm run build 2>&1
   ```

3. **code-improvement-advisor sub-agent** (run_in_background: true) — Review recently changed files in:
   - frontend/src/app/tastings/
   - frontend/src/app/menu-sketch/
   - frontend/src/components/tasting/
   - backend/app/api/tastings.py
   - backend/app/domain/tasting_session_service.py

Wait for all three to complete, then summarise results in a single report:
- Backend: X/Y tests passed
- Frontend: build status, error count, warning count
- Code review: top findings by severity
