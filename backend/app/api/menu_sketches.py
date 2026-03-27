"""Menu sketch API router — freeform canvas menu sketches."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import get_session
from app.domain.menu_sketch_service import MenuSketchService
from app.models.menu_sketch import (
    MenuSketch,
    MenuSketchCreate,
    MenuSketchRead,
    MenuSketchUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MenuSketchRead])
def list_menu_sketches(
    session: Session = Depends(get_session),
) -> list[MenuSketch]:
    """List all menu sketches."""
    return MenuSketchService(session).list_sketches()


@router.get("/{sketch_id}", response_model=MenuSketchRead)
def get_menu_sketch(
    sketch_id: int,
    session: Session = Depends(get_session),
) -> MenuSketch:
    """Get a single menu sketch by ID."""
    sketch = MenuSketchService(session).get_sketch(sketch_id)
    if sketch is None:
        raise HTTPException(status_code=404, detail="Sketch not found")
    return sketch


@router.post("", response_model=MenuSketchRead, status_code=201)
def create_menu_sketch(
    data: MenuSketchCreate,
    session: Session = Depends(get_session),
) -> MenuSketch:
    """Create a new menu sketch."""
    return MenuSketchService(session).create_sketch(data)


@router.patch("/{sketch_id}", response_model=MenuSketchRead)
def update_menu_sketch(
    sketch_id: int,
    data: MenuSketchUpdate,
    session: Session = Depends(get_session),
) -> MenuSketch:
    """Update a menu sketch."""
    sketch = MenuSketchService(session).update_sketch(sketch_id, data)
    if sketch is None:
        raise HTTPException(status_code=404, detail="Sketch not found")
    return sketch


@router.delete("/{sketch_id}", status_code=204)
def delete_menu_sketch(
    sketch_id: int,
    session: Session = Depends(get_session),
) -> None:
    """Hard-delete a menu sketch."""
    deleted = MenuSketchService(session).delete_sketch(sketch_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sketch not found")


@router.post("/{sketch_id}/fork", response_model=MenuSketchRead, status_code=201)
def fork_menu_sketch(
    sketch_id: int,
    session: Session = Depends(get_session),
) -> MenuSketch:
    """Fork a menu sketch — creates a copy with incremented version."""
    sketch = MenuSketchService(session).fork_sketch(sketch_id)
    if sketch is None:
        raise HTTPException(status_code=404, detail="Sketch not found")
    return sketch
