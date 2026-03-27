"""Menu sketch service — business logic for freeform menu sketches."""

from datetime import datetime

from sqlmodel import Session, select

from app.models.menu_sketch import (
    MenuSketch,
    MenuSketchCreate,
    MenuSketchUpdate,
)


class MenuSketchService:
    """Service for menu sketch management."""

    def __init__(self, session: Session):
        self.session = session

    def list_sketches(self) -> list[MenuSketch]:
        """Return all menu sketches ordered by most recently updated."""
        return list(
            self.session.exec(
                select(MenuSketch).order_by(MenuSketch.updated_at.desc())  # type: ignore[arg-type]
            ).all()
        )

    def get_sketch(self, sketch_id: int) -> MenuSketch | None:
        """Get a single sketch by ID."""
        return self.session.get(MenuSketch, sketch_id)

    def create_sketch(self, data: MenuSketchCreate) -> MenuSketch:
        """Create a new sketch with empty sections."""
        sketch = MenuSketch(
            name=data.name,
            version=1,
            sections=[],
            comments={},
            notes=None,
        )
        self.session.add(sketch)
        self.session.commit()
        self.session.refresh(sketch)
        return sketch

    def update_sketch(
        self, sketch_id: int, data: MenuSketchUpdate
    ) -> MenuSketch | None:
        """Update mutable fields on a sketch."""
        sketch = self.session.get(MenuSketch, sketch_id)
        if sketch is None:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sketch, field, value)
        if update_data:
            sketch.updated_at = datetime.utcnow()

        self.session.add(sketch)
        self.session.commit()
        self.session.refresh(sketch)
        return sketch

    def delete_sketch(self, sketch_id: int) -> bool:
        """Hard-delete a sketch. Returns True if deleted, False if not found."""
        sketch = self.session.get(MenuSketch, sketch_id)
        if sketch is None:
            return False
        self.session.delete(sketch)
        self.session.commit()
        return True

    def fork_sketch(self, sketch_id: int) -> MenuSketch | None:
        """Fork a sketch — copy all fields and increment version."""
        original = self.session.get(MenuSketch, sketch_id)
        if original is None:
            return None

        forked = MenuSketch(
            name=original.name,
            version=original.version + 1,
            sections=list(original.sections),
            comments={},
            notes=None,
        )
        self.session.add(forked)
        self.session.commit()
        self.session.refresh(forked)
        return forked
