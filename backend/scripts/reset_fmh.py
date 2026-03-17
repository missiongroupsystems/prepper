#!/usr/bin/env python3
"""FMH reset script — removes all FMH-seeded data.

Deletes rows from:
  - supplier_ingredients  (where source = 'fmh')
  - ingredients           (where source = 'fmh')
  - categories            (where source = 'fmh')
  - suppliers             (where source = 'fmh')
  - outlets               (where source = 'fmh')

Note: `outlet_supplier_ingredient` does not exist as a separate table;
outlet references live inside `supplier_ingredients`.

Run with:
    python -m scripts.reset_fmh
    python -m scripts.reset_fmh --yes   # skip confirmation prompt
"""

import argparse
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import inspect, text
from sqlmodel import Session

from app.database import engine


def table_exists(connection, table_name: str) -> bool:
    inspector = inspect(connection)
    return table_name in inspector.get_table_names()


def reset_fmh(session: Session) -> None:
    conn = session.connection()

    # Backward-compat check: outlet_supplier_ingredient (does not exist)
    if table_exists(conn, "outlet_supplier_ingredient"):
        result = conn.execute(text("DELETE FROM outlet_supplier_ingredient"))
        print(f"  outlet_supplier_ingredient: {result.rowcount} rows deleted")
    else:
        print("  outlet_supplier_ingredient: table not found, skipping")

    # 1. supplier_ingredients (fmh source only — preserves manual entries)
    result = conn.execute(
        text("DELETE FROM supplier_ingredients WHERE source = 'fmh'")
    )
    print(f"  supplier_ingredients (source=fmh): {result.rowcount} rows deleted")

    # 2. ingredients (fmh source only)
    result = conn.execute(
        text("DELETE FROM ingredients WHERE source = 'fmh'")
    )
    print(f"  ingredients (source=fmh): {result.rowcount} rows deleted")

    # 3. categories — NULL out category_id on fmh ingredients first, then delete fmh categories
    conn.execute(text("UPDATE ingredients SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE source = 'fmh')"))
    result = conn.execute(text("DELETE FROM categories WHERE source = 'fmh'"))
    print(f"  categories (source=fmh): {result.rowcount} rows deleted")

    # 4. suppliers (fmh source only)
    result = conn.execute(text("DELETE FROM suppliers WHERE source = 'fmh'"))
    print(f"  suppliers (source=fmh): {result.rowcount} rows deleted")

    # 5. outlets (fmh source only)
    result = conn.execute(text("DELETE FROM outlets WHERE source = 'fmh'"))
    print(f"  outlets (source=fmh): {result.rowcount} rows deleted")

    session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset FMH-seeded data")
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Skip confirmation prompt",
    )
    args = parser.parse_args()

    if not args.yes:
        print("This will delete all FMH data from:")
        print("  - supplier_ingredients (source=fmh)")
        print("  - ingredients (source=fmh)")
        print("  - categories (source=fmh)")
        print("  - suppliers (source=fmh)")
        print("  - outlets (source=fmh)")
        answer = input("Continue? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            sys.exit(0)

    print("\nResetting FMH data...")
    with Session(engine) as session:
        reset_fmh(session)

    print("\nDone.")


if __name__ == "__main__":
    main()
