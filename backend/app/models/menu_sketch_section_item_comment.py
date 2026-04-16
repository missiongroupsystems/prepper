"""MenuSketchSectionItemComment model — per-dish comments on a menu sketch."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class MenuSketchSectionItemComment(SQLModel, table=True):
    """A comment thread entry for a specific dish in a menu sketch."""

    __tablename__ = "menu_sketch_section_item_comments"

    id: int | None = Field(default=None, primary_key=True)
    menu_sketch_section_item_id: int = Field(
        foreign_key="menu_sketch_section_item.id"
    )
    text: str
    resolved: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MenuSketchSectionItemCommentCreate(SQLModel):
    """Schema for creating a new comment."""

    menu_sketch_section_item_id: int
    text: str


class MenuSketchSectionItemCommentUpdate(SQLModel):
    """Schema for updating a comment (text only)."""

    text: str | None = None


class MenuSketchSectionItemCommentRead(SQLModel):
    """Schema for reading a comment (API response)."""

    id: int
    menu_sketch_section_item_id: int
    text: str
    resolved: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Aggregated response DTOs (used by the comments summary endpoint)
# ---------------------------------------------------------------------------

class CommentRead(SQLModel):
    id: int
    text: str
    resolved: bool
    created_at: datetime


class DishCommentsRead(SQLModel):
    menu_sketch_section_item_id: int
    name: str | None  # resolved from the linked recipe
    comments: list[CommentRead]


class MenuSketchCommentsResponse(SQLModel):
    data: list[DishCommentsRead]
