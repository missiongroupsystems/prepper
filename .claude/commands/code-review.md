Review recently modified code files for quality issues using a code-improvement-advisor sub-agent.

Launch a code-improvement-advisor sub-agent to scan the files touched by the most recent commits. Focus on:
- frontend/src/app/tastings/
- frontend/src/app/menu-sketch/
- frontend/src/components/tasting/
- backend/app/api/tastings.py
- backend/app/domain/tasting_session_service.py
- backend/app/domain/menu_sketch_service.py

Look for: unhandled edge cases, type safety problems, missing error states, accessibility issues in UI components, React hook dependency problems, and any obvious bugs.

Report findings with file paths and line numbers, grouped by severity.
