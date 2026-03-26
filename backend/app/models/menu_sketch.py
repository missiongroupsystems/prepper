"""MenuSketch model - freeform input-driven menu builder."""

from datetime import datetime
from typing import Any

from pydantic import field_validator
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class MenuSketch(SQLModel, table=True):
    """
    Freeform menu sketch.

    Stores layout data as nested JSON (sections → dishes) rather than
    relational rows, enabling rapid freeform menu brainstorming.
    """

    __tablename__ = "menus_sketch"

    id: int | None = Field(default=None, primary_key=True)
    version: int = Field(default=1)
    name: str = Field(default="Untitled Menu")

    # Nested JSON: list of SketchSection objects, each containing a list of SketchDish
    sections: list = Field(default_factory=list, sa_column=Column(JSON))

    # Per-dish comments keyed by dish UUID: Record<dish_id, SketchComment[]>
    comments: dict = Field(default_factory=dict, sa_column=Column(JSON))

    # Menu-wide rich-text notes (HTML string from Tiptap)
    notes: str | None = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MenuSketchCreate(SQLModel):
    """Schema for creating a new menu sketch."""

    name: str = "Untitled Menu"


class MenuSketchUpdate(SQLModel):
    """Schema for updating a menu sketch (all fields optional)."""

    name: str | None = None
    sections: list | None = None
    comments: dict | None = None
    notes: str | None = None


class MenuSketchRead(SQLModel):
    """Schema for reading a menu sketch (API response)."""

    id: int
    version: int
    name: str
    sections: list
    comments: dict
    notes: str | None
    created_at: datetime
    updated_at: datetime

    @field_validator("comments", mode="before")
    @classmethod
    def coerce_comments(cls, v: Any) -> dict:
        return v if isinstance(v, dict) else {}
