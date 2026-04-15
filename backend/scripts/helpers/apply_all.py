"""Apply all RLS helper functions to the database.

Runs each helper in dependency order — simpler functions first so that
functions which call others (e.g. can_access_recipe calls is_admin)
are always created after their dependencies.

Usage:
    python -m scripts.helpers.apply_all
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlmodel import Session

from app.config import get_settings
from app.database import engine

# Import in dependency order
from scripts.helpers import (
    current_user_id,
    is_admin,
    is_manager_or_admin,
    can_access_recipe,
    owns_recipe,
    can_access_tasting_session,
    owns_tasting_session,
    can_access_menu,
)

HELPERS = [
    current_user_id,
    is_admin,
    is_manager_or_admin,
    can_access_recipe,
    owns_recipe,
    can_access_tasting_session,
    owns_tasting_session,
    can_access_menu,
]


def main() -> None:
    settings = get_settings()
    print(f"DATABASE_URL: {settings.database_url}")
    print(f"dialect:      {engine.dialect.name}\n")
    if engine.dialect.name == "sqlite":
        print("ERROR: These helper functions require PostgreSQL (Supabase).")
        print("Set DATABASE_URL to your Supabase connection string and retry.")
        sys.exit(1)

    print("Applying RLS helper functions...\n")
    with Session(engine) as session:
        for helper in HELPERS:
            helper.apply(session)
            print(f"OK  {helper.__name__.split('.')[-1]}")
        session.commit()
    print("\nAll helpers applied.")


if __name__ == "__main__":
    main()
