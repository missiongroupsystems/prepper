# Backend Rules (FastAPI)

## Structure
- `models/` — SQLModel entities
- `domain/` — service layer, one file per resource (recipe, costing, sub-recipes, outlets, tasting, suppliers, categories, menu-sketch, users, Supabase auth)
- `api/` — FastAPI routers (one per resource) + `deps.py`
- `agents/` — AI features (`base_agent.py`, `category_agent.py`, `feedback_summary_agent.py`)
- `utils/` — unit conversion helpers

## Service layer pattern
- Services receive a SQLModel `Session` and return domain objects.
- Routers depend on services via plain function calls — no DI framework.
- Don't push business logic into routers or models.

## Validations
- **Cycle detection** on outlet hierarchies and sub-recipes is mandatory — use the existing helpers, don't rewrite.
- **Access control**: non-admin users restricted to outlets in their hierarchy. Tasting session access: participants-only for non-admin.
- **Soft delete** is the norm for categories and suppliers — archived records remain for historical reference.

## AI agents
- Extend `base_agent.py` — don't create ad-hoc LLM calls in services.
- Agents live in `app/agents/` and expose a single callable used by the router.

## Wastage and costing
- `RecipeIngredient.wastage_percentage` (0–100) factors into ingredient unit prices.
- Costing results carry `adjusted_cost_per_unit`.
- Don't compute cost in the router or on the client — use `costing_service.py`.
