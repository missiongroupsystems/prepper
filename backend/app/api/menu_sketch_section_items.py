"""Menu sketch section item API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import get_session
from app.domain.menu_sketch_section_item_service import MenuSketchSectionItemService
from app.models.menu_sketch_section_item import (
    MenuSketchSectionItem,
    MenuSketchSectionItemCreate,
    MenuSketchSectionItemRead,
    MenuSketchSectionItemUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MenuSketchSectionItemRead])
def list_menu_sketch_section_items(
    section_id: int,
    session: Session = Depends(get_session),
) -> list[MenuSketchSectionItem]:
    """List all items for a section."""
    return MenuSketchSectionItemService(session).list_items(section_id)


@router.post("", response_model=MenuSketchSectionItemRead, status_code=201)
def create_menu_sketch_section_item(
    data: MenuSketchSectionItemCreate,
    session: Session = Depends(get_session),
) -> MenuSketchSectionItem:
    """Create a dish item. Returns 404 if section does not exist."""
    item = MenuSketchSectionItemService(session).create_item(data)
    if item is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return item


@router.patch("/{item_id}", response_model=MenuSketchSectionItemRead)
def update_menu_sketch_section_item(
    item_id: int,
    data: MenuSketchSectionItemUpdate,
    session: Session = Depends(get_session),
) -> MenuSketchSectionItem:
    """Update a dish item. If the item has a linked recipe with tasting feedback,
    the recipe is silently forked before applying the name change."""
    item = MenuSketchSectionItemService(session).update_item(item_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=200)
def delete_menu_sketch_section_item(
    item_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Hard-delete a dish item. The linked recipe is NOT deleted."""
    deleted = MenuSketchSectionItemService(session).delete_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}
