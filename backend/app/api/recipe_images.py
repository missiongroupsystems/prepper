"""Recipe images API routes."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import (
    get_current_user,
    get_editable_recipe,
    get_session,
    require_recipe_editor,
)
from app.config import get_settings
from app.domain import RecipeImageService
from app.domain.storage_service import (
    StorageError,
    StorageService,
    is_storage_configured,
)
from app.models import RecipeImage, User

router = APIRouter()


class AddRecipeImageRequest(BaseModel):
    """Request body for adding an image to a recipe."""

    image_base64: str


class ReorderRecipeImagesRequest(BaseModel):
    """Request body for reordering recipe images."""

    images: list[dict]  # Each item should have 'id' and 'order' keys


@router.post(
    "/{recipe_id}",
    response_model=RecipeImage,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_editable_recipe)],
)
async def add_recipe_image(
    recipe_id: int,
    data: AddRecipeImageRequest,
    session: Session = Depends(get_session),
):
    """
    Upload a base64-encoded image for a recipe.

    1. Uploads the image to Supabase Storage
    2. Creates a RecipeImage database record with the URL
    """
    # Check if storage is configured
    if not is_storage_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image storage is not configured",
        )

    # Upload to Supabase
    try:
        storage_service = StorageService()
        image_url = await storage_service.upload_image_from_base64(
            data.image_base64, recipe_id, folder=get_settings().supabase_recipe_images_folder
        )
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}",
        )

    # Create database record
    image_service = RecipeImageService(session)
    image = await asyncio.to_thread(image_service.add_image, recipe_id, image_url)
    return image


@router.get("/main/{recipe_id}", response_model=RecipeImage | None)
def get_main_recipe_image(
    recipe_id: int,
    session: Session = Depends(get_session),
):
    """Get the main (preferred) image for a recipe."""
    service = RecipeImageService(session)
    image = service.get_main_image(recipe_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No main image found for recipe",
        )
    return image


class SetMainImageRequest(BaseModel):
    """Request body for setting an image as main."""

    pass


@router.patch("/main/{image_id}", response_model=RecipeImage)
def set_main_image(
    image_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Set an image as the main (preferred) image for its recipe."""
    service = RecipeImageService(session)

    # Get the image to find the recipe_id
    image = service.get_image(image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    require_recipe_editor(session, image.recipe_id, current_user)

    # Set as main
    updated_image = service.set_main_image(image.recipe_id, image_id)
    if not updated_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to set image as main",
        )

    return updated_image


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe_image(
    image_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a recipe image."""
    service = RecipeImageService(session)
    image = service.get_image(image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    require_recipe_editor(session, image.recipe_id, current_user)
    success = service.delete_image(image_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )


@router.patch(
    "/{recipe_id}",
    response_model=list[RecipeImage],
    dependencies=[Depends(get_editable_recipe)],
)
def reorder_recipe_images(
    recipe_id: int,
    data: ReorderRecipeImagesRequest,
    session: Session = Depends(get_session),
):
    """Reorder images for a recipe."""
    service = RecipeImageService(session)
    images = service.reorder_images(recipe_id, data.images)
    return images


@router.get("/{recipe_id}", response_model=list[RecipeImage])
def get_recipe_images(
    recipe_id: int,
    session: Session = Depends(get_session),
):
    """Get all images for a recipe."""
    service = RecipeImageService(session)
    images = service.get_recipe_images(recipe_id)
    return images
