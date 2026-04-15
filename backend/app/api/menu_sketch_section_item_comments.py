"""Menu sketch section item comment API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import get_session
from app.domain.menu_sketch_section_item_comment_service import (
    MenuSketchSectionItemCommentService,
)
from app.models.menu_sketch_section_item_comment import (
    MenuSketchCommentsResponse,
    MenuSketchSectionItemComment,
    MenuSketchSectionItemCommentCreate,
    MenuSketchSectionItemCommentRead,
    MenuSketchSectionItemCommentUpdate,
)

router = APIRouter()


@router.get("/menu-sketch/{menu_sketch_id}", response_model=MenuSketchCommentsResponse)
def get_comments_for_menu(
    menu_sketch_id: int,
    session: Session = Depends(get_session),
) -> MenuSketchCommentsResponse:
    """Aggregated comments for all dishes in a menu sketch."""
    return MenuSketchSectionItemCommentService(session).get_comments_for_menu(
        menu_sketch_id
    )


@router.post("", response_model=MenuSketchSectionItemCommentRead, status_code=201)
def create_comment(
    data: MenuSketchSectionItemCommentCreate,
    session: Session = Depends(get_session),
) -> MenuSketchSectionItemComment:
    """Add a comment to a dish item. Returns 404 if item does not exist."""
    comment = MenuSketchSectionItemCommentService(session).create_comment(data)
    if comment is None:
        raise HTTPException(status_code=404, detail="Section item not found")
    return comment


@router.patch("/{comment_id}", response_model=MenuSketchSectionItemCommentRead)
def update_comment(
    comment_id: int,
    data: MenuSketchSectionItemCommentUpdate,
    session: Session = Depends(get_session),
) -> MenuSketchSectionItemComment:
    """Update comment text."""
    comment = MenuSketchSectionItemCommentService(session).update_comment(
        comment_id, data
    )
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.patch("/resolve/{comment_id}", response_model=MenuSketchSectionItemCommentRead)
def resolve_comment(
    comment_id: int,
    session: Session = Depends(get_session),
) -> MenuSketchSectionItemComment:
    """Mark a comment as resolved."""
    comment = MenuSketchSectionItemCommentService(session).resolve_comment(comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.delete("/{comment_id}", status_code=200)
def delete_comment(
    comment_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Hard-delete a comment."""
    deleted = MenuSketchSectionItemCommentService(session).delete_comment(comment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"ok": True}
