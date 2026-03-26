"""Supplier ingredient tag domain operations."""

from sqlmodel import Session, select

from app.models.supplier_ingredient_tag import (
    SupplierIngredientTag,
    SupplierIngredientTagLink,
)


def list_tags(session: Session) -> list[SupplierIngredientTag]:
    """Return all active supplier ingredient tags."""
    return list(
        session.exec(
            select(SupplierIngredientTag).where(SupplierIngredientTag.is_active == True)
        ).all()
    )


def create_tag(session: Session, name: str) -> SupplierIngredientTag:
    """Create a new tag. Raises ValueError if name already exists (active)."""
    existing = session.exec(
        select(SupplierIngredientTag).where(
            SupplierIngredientTag.name == name,
            SupplierIngredientTag.is_active == True,
        )
    ).first()
    if existing:
        raise ValueError(f"Tag with name '{name}' already exists")

    tag = SupplierIngredientTag(name=name)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def delete_tag(session: Session, tag_id: int) -> SupplierIngredientTag | None:
    """Soft-delete a tag by setting is_active=False."""
    tag = session.get(SupplierIngredientTag, tag_id)
    if not tag:
        return None
    tag.is_active = False
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def get_tags_for_supplier_ingredient(
    session: Session, si_id: int
) -> list[SupplierIngredientTag]:
    """Return all active tags linked to a supplier ingredient."""
    statement = (
        select(SupplierIngredientTag)
        .join(
            SupplierIngredientTagLink,
            SupplierIngredientTagLink.supplier_ingredient_tag_id
            == SupplierIngredientTag.id,
        )
        .where(
            SupplierIngredientTagLink.supplier_ingredient_id == si_id,
            SupplierIngredientTag.is_active == True,
        )
    )
    return list(session.exec(statement).all())


def add_tag_to_supplier_ingredient(
    session: Session, si_id: int, tag_id: int
) -> None:
    """Link a tag to a supplier ingredient. Silently ignores duplicate links."""
    existing = session.exec(
        select(SupplierIngredientTagLink).where(
            SupplierIngredientTagLink.supplier_ingredient_id == si_id,
            SupplierIngredientTagLink.supplier_ingredient_tag_id == tag_id,
        )
    ).first()
    if existing:
        return

    link = SupplierIngredientTagLink(
        supplier_ingredient_id=si_id,
        supplier_ingredient_tag_id=tag_id,
    )
    session.add(link)
    session.commit()


def remove_tag_from_supplier_ingredient(
    session: Session, si_id: int, tag_id: int
) -> bool:
    """Remove a tag link from a supplier ingredient. Returns True if removed."""
    link = session.exec(
        select(SupplierIngredientTagLink).where(
            SupplierIngredientTagLink.supplier_ingredient_id == si_id,
            SupplierIngredientTagLink.supplier_ingredient_tag_id == tag_id,
        )
    ).first()
    if not link:
        return False
    session.delete(link)
    session.commit()
    return True
