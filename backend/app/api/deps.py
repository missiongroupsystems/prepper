"""Shared dependencies for API routes."""

from collections.abc import Generator

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session

from app.database import engine
from app.domain.recipe_permissions import can_edit_recipe, can_view_recipe
from app.domain.recipe_service import RecipeService
from app.domain.supabase_auth_service import get_auth_service
from app.domain.user_service import UserService
from app.models import Recipe, User


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for dependency injection."""
    with Session(engine) as session:
        yield session


def get_current_user(
    authorization: str | None = Header(None),
    session: Session = Depends(get_session),
) -> User:
    """
    Extract JWT from Authorization header, verify it, and return the user.

    Raises:
        HTTPException: 401 if token is missing or invalid, 404 if user not found
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = authorization.replace("Bearer ", "")
    auth_service = get_auth_service()

    # Verify token and get user ID
    user_id = auth_service.verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Get user from database
    user_service = UserService(session)
    user = user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


def get_viewable_recipe(
    recipe_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Recipe:
    """
    Dependency returning the recipe named by the `recipe_id` path parameter if the user may see it.

    Raises:
        HTTPException: 404 if the recipe doesn't exist, 403 if the user may not see it
    """
    recipe = RecipeService(session).get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )
    if not can_view_recipe(session, recipe, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this recipe",
        )
    return recipe


def require_recipe_editor(session: Session, recipe_id: int, user: User) -> Recipe:
    """
    Return the recipe if the user may edit it.

    Raises:
        HTTPException: 404 if the recipe doesn't exist, 403 if the user may not edit it
    """
    recipe = RecipeService(session).get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )
    if not can_edit_recipe(recipe, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this recipe",
        )
    return recipe


def get_editable_recipe(
    recipe_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Recipe:
    """Dependency for routes that change the recipe named by the `recipe_id` path parameter."""
    return require_recipe_editor(session, recipe_id, current_user)
