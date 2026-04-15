"""Menu sketch section service — business logic for relational sections."""

from datetime import datetime

from sqlmodel import Session, select

from app.models.menu_sketch import MenuSketch
from app.models.menu_sketch_section import (
    MenuSketchSection,
    MenuSketchSectionCreate,
    MenuSketchSectionUpdate,
)


class MenuSketchSectionService:
    """Service for menu sketch section management."""

    def __init__(self, session: Session):
        self.session = session

    def list_sections(self, menu_sketch_id: int) -> list[MenuSketchSection]:
        """Return all sections for a menu sketch ordered by order_no."""
        return list(
            self.session.exec(
                select(MenuSketchSection)
                .where(MenuSketchSection.menu_sketch_id == menu_sketch_id)
                .order_by(MenuSketchSection.order_no)
            ).all()
        )

    def create_section(self, data: MenuSketchSectionCreate) -> MenuSketchSection | None:
        """Create a section. Returns None if menu_sketch_id does not exist."""
        sketch = self.session.get(MenuSketch, data.menu_sketch_id)
        if sketch is None:
            return None

        section = MenuSketchSection(
            name=data.name,
            menu_sketch_id=data.menu_sketch_id,
            order_no=data.order_no,
        )
        self.session.add(section)
        self.session.commit()
        self.session.refresh(section)
        return section

    def update_section(
        self, section_id: int, data: MenuSketchSectionUpdate
    ) -> MenuSketchSection | None:
        """Update mutable fields on a section."""
        section = self.session.get(MenuSketchSection, section_id)
        if section is None:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(section, field, value)
        if update_data:
            section.updated_at = datetime.utcnow()

        self.session.add(section)
        self.session.commit()
        self.session.refresh(section)
        return section

    def delete_section(self, section_id: int) -> bool:
        """Hard-delete a section (cascade deletes items via FK).

        Returns True if found and deleted, False otherwise.
        """
        section = self.session.get(MenuSketchSection, section_id)
        if section is None:
            return False
        self.session.delete(section)
        self.session.commit()
        return True
