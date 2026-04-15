"""Menu sketch section item service — business logic for dish items."""

from datetime import datetime

from sqlmodel import Session, select

from app.models.menu_sketch_section import MenuSketchSection
from app.models.menu_sketch_section_item import (
    MenuSketchSectionItem,
    MenuSketchSectionItemCreate,
    MenuSketchSectionItemUpdate,
)
from app.models.recipe import Recipe
from app.models.tasting import TastingNote


class MenuSketchSectionItemService:
    """Service for menu sketch section item (dish) management."""

    def __init__(self, session: Session):
        self.session = session

    def list_items(self, section_id: int) -> list[MenuSketchSectionItem]:
        """Return all items for a section ordered by order_no."""
        return list(
            self.session.exec(
                select(MenuSketchSectionItem)
                .where(MenuSketchSectionItem.menu_sketch_section_id == section_id)
                .order_by(MenuSketchSectionItem.order_no)
            ).all()
        )

    def create_item(self, data: MenuSketchSectionItemCreate) -> MenuSketchSectionItem | None:
        """Create a dish item. Returns None if section does not exist."""
        section = self.session.get(MenuSketchSection, data.menu_sketch_section_id)
        if section is None:
            return None

        item = MenuSketchSectionItem(
            menu_sketch_section_id=data.menu_sketch_section_id,
            recipe_id=data.recipe_id,
            name=data.name,
            sales_price=data.sales_price,
            cost_price=data.cost_price,
            description=data.description,
            is_highlight=data.is_highlight,
            icons=data.icons,
            order_no=data.order_no,
        )
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def update_item(
        self, item_id: int, data: MenuSketchSectionItemUpdate
    ) -> MenuSketchSectionItem | None:
        """Update a dish item with optional recipe fork logic.

        Fork logic (only when item has a linked recipe):
        - If the recipe already has tasting feedback → fork it (version+1, root_id=old id)
          and update item.recipe_id to the new fork.
        - If no feedback exists → update recipe.name in place if name changed.
        """
        item = self.session.get(MenuSketchSectionItem, item_id)
        if item is None:
            return None

        update_data = data.model_dump(exclude_unset=True)
        new_name = update_data.get("name")

        # Recipe fork / update logic
        if item.recipe_id is not None and new_name is not None:
            recipe = self.session.get(Recipe, item.recipe_id)
            if recipe is not None:
                if self._recipe_has_feedback(item.recipe_id):
                    # Fork the recipe
                    forked = Recipe(
                        name=new_name,
                        version=recipe.version + 1,
                        root_id=recipe.id,
                        yield_quantity=recipe.yield_quantity,
                        yield_unit=recipe.yield_unit,
                        is_prep_recipe=recipe.is_prep_recipe,
                        status=recipe.status,
                        owner_id=recipe.owner_id,
                    )
                    self.session.add(forked)
                    self.session.commit()
                    self.session.refresh(forked)
                    item.recipe_id = forked.id
                else:
                    # Safe to update name in place
                    recipe.name = new_name
                    self.session.add(recipe)

        # Apply remaining field updates to the item
        for field, value in update_data.items():
            setattr(item, field, value)
        item.updated_at = datetime.utcnow()

        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def delete_item(self, item_id: int) -> bool:
        """Hard-delete an item row. The linked recipe is NOT deleted.

        Returns True if found and deleted, False otherwise.
        """
        item = self.session.get(MenuSketchSectionItem, item_id)
        if item is None:
            return False
        self.session.delete(item)
        self.session.commit()
        return True

    def _recipe_has_feedback(self, recipe_id: int) -> bool:
        """Return True if any tasting note exists for this recipe."""
        result = self.session.exec(
            select(TastingNote).where(TastingNote.recipe_id == recipe_id).limit(1)
        ).first()
        return result is not None
