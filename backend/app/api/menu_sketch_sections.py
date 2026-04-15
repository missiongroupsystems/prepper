"""Menu sketch section API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import get_session
from app.domain.menu_sketch_section_service import MenuSketchSectionService
from app.models.menu_sketch_section import (
    MenuSketchSection,
    MenuSketchSectionCreate,
    MenuSketchSectionRead,
    MenuSketchSectionUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MenuSketchSectionRead])
def list_menu_sketch_sections(
    menu_sketch_id: int,
    session: Session = Depends(get_session),
) -> list[MenuSketchSection]:
    """List all sections for a menu sketch."""
    return MenuSketchSectionService(session).list_sections(menu_sketch_id)


@router.post("", response_model=MenuSketchSectionRead, status_code=201)
def create_menu_sketch_section(
    data: MenuSketchSectionCreate,
    session: Session = Depends(get_session),
) -> MenuSketchSection:
    """Create a section. Returns 404 if menu_sketch_id does not exist."""
    section = MenuSketchSectionService(session).create_section(data)
    if section is None:
        raise HTTPException(status_code=404, detail="Menu sketch not found")
    return section


@router.patch("/{section_id}", response_model=MenuSketchSectionRead)
def update_menu_sketch_section(
    section_id: int,
    data: MenuSketchSectionUpdate,
    session: Session = Depends(get_session),
) -> MenuSketchSection:
    """Update a section."""
    section = MenuSketchSectionService(session).update_section(section_id, data)
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.delete("/{section_id}", status_code=200)
def delete_menu_sketch_section(
    section_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Hard-delete a section (cascades to items and comments)."""
    deleted = MenuSketchSectionService(session).delete_section(section_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"ok": True}
