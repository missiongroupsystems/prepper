"""Who may see or change a dish. The edit rule mirrors frontend/src/lib/permissions/recipe.ts."""

from sqlmodel import Session, col, select

from app.domain.outlet_service import OutletService
from app.models import OutletType, Recipe, RecipeOutlet, User, UserType


def can_edit_recipe(recipe: Recipe, user: User) -> bool:
    """A dish may be changed by its owner or by an admin."""
    return user.user_type == UserType.ADMIN or (
        recipe.owner_id is not None and recipe.owner_id == user.id
    )


def can_view_recipe(session: Session, recipe: Recipe, user: User) -> bool:
    """
    A dish may be seen by:
    - Admin users
    - Its owner
    - Any authenticated user, if it is public
    - Outlet-based access:
      - Location users: recipes from their own outlet AND their parent brand outlet
      - Brand users: recipes from their own brand outlet only (not from child locations)
    """
    if (
        user.user_type == UserType.ADMIN
        or recipe.owner_id == user.id
        or recipe.is_public
    ):
        return True
    if not user.outlet_id:
        return False

    user_outlet = OutletService(session).get_outlet(user.outlet_id)
    if not user_outlet:
        return False

    accessible_outlet_ids = {user.outlet_id}
    if user_outlet.outlet_type == OutletType.LOCATION and user_outlet.parent_outlet_id:
        accessible_outlet_ids.add(user_outlet.parent_outlet_id)

    statement = select(RecipeOutlet).where(
        RecipeOutlet.recipe_id == recipe.id,
        col(RecipeOutlet.outlet_id).in_(accessible_outlet_ids),
        RecipeOutlet.is_active,
    )
    return session.exec(statement).first() is not None
