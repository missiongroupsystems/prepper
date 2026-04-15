"""MenuSketchSection model — relational section within a menu sketch."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class MenuSketchSection(SQLModel, table=True):
    """A named section (e.g. 'Starters') within a MenuSketch."""

    __tablename__ = "menu_sketch_section"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    menu_sketch_id: int = Field(foreign_key="menus_sketch.id")
    order_no: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MenuSketchSectionCreate(SQLModel):
    """Schema for creating a new section."""

    menu_sketch_id: int
    name: str
    order_no: int = 0


class MenuSketchSectionUpdate(SQLModel):
    """Schema for updating a section (all fields optional)."""

    name: str | None = None
    order_no: int | None = None


class MenuSketchSectionRead(SQLModel):
    """Schema for reading a section (API response)."""

    id: int
    name: str
    menu_sketch_id: int
    order_no: int
    created_at: datetime
    updated_at: datetime
