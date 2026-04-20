# Testing Rules

## Policy
- New behavior requires tests unless explicitly impossible.
- Bug fixes include a regression test.
- Don't report success if tests/lint/build fail.

## Backend (pytest)
- `cd backend && pytest` — all tests
- `pytest tests/test_recipes.py` — single file
- `pytest -k "test_create"` — by name pattern
- SQLite in-memory via `conftest.py` fixtures.
- Lint + format: `ruff check .` and `ruff format .`. Types: `mypy app/`.

## Frontend
- Type checking happens during `npm run build`.
- Lint: `npm run lint` (or use `/fe-build-check` command).
- Don't mark work done if lint or build fails.

## Coverage focus
Tasting access control, cycle detection (outlets, sub-recipes), costing with wastage, and recipe versioning must have explicit test coverage.
