"""Who may change a dish: owner or admin. Everyone else gets 403; a missing dish is 404."""

from collections.abc import Callable
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.api.deps import get_current_user
from app.main import app
from app.models import User, UserType

ADMIN_ID = "test-admin-user"  # created by the `client` fixture
OWNER_ID = "dish-owner"
OTHER_ID = "other-cook"
MISSING_RECIPE_ID = 99999


@dataclass
class Dish:
    """A dish owned by OWNER_ID with one of each child record attached."""

    recipe_id: int
    child_recipe_id: int
    recipe_ingredient_id: int
    spare_ingredient_id: int
    sub_recipe_link_id: int
    outlet_id: int
    spare_outlet_id: int
    image_id: int
    category_id: int
    category_link_id: int


def _add_user(session: Session, user_id: str) -> User:
    user = User(
        id=user_id,
        email=f"{user_id}@test.com",
        username=user_id,
        user_type=UserType.NORMAL,
        outlet_id=None,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_recipe(
    client: TestClient, name: str, owner_id: str, is_public: bool = False
) -> int:
    response = client.post(
        "/api/v1/recipes",
        json={
            "name": name,
            "yield_quantity": 1,
            "yield_unit": "portion",
            "owner_id": owner_id,
            "is_public": is_public,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_outlet(client: TestClient, name: str, code: str) -> int:
    response = client.post(
        "/api/v1/outlets",
        json={"name": name, "code": code, "outlet_type": "brand"},
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture
def users(session: Session, client: TestClient) -> dict[str, User]:
    """Owner, admin and another normal user. Depends on `client` so the admin exists."""
    admin = session.get(User, ADMIN_ID)
    assert admin is not None
    return {
        "owner": _add_user(session, OWNER_ID),
        "admin": admin,
        "other": _add_user(session, OTHER_ID),
    }


@pytest.fixture
def act_as(users: dict[str, User]) -> Callable[[str], None]:
    """Switch the signed-in user for subsequent requests."""

    def _act_as(role: str) -> None:
        user = users[role]
        app.dependency_overrides[get_current_user] = lambda: user

    return _act_as


@pytest.fixture
def dish(client: TestClient, act_as: Callable[[str], None]) -> Dish:
    """Build the dish as admin, then leave the admin signed in."""
    act_as("admin")
    recipe_id = _create_recipe(client, "Owned Dish", OWNER_ID)
    child_recipe_id = _create_recipe(client, "Child Prep", OWNER_ID)

    ingredient = client.post(
        "/api/v1/ingredients",
        json={"name": "Flour", "base_unit": "g", "cost_per_base_unit": 0.002},
    ).json()
    spare_ingredient = client.post(
        "/api/v1/ingredients",
        json={"name": "Sugar", "base_unit": "g", "cost_per_base_unit": 0.003},
    ).json()
    recipe_ingredient = client.post(
        f"/api/v1/recipes/{recipe_id}/ingredients",
        json={"ingredient_id": ingredient["id"], "quantity": 500, "unit": "g"},
    ).json()

    link = client.post(
        f"/api/v1/recipes/{recipe_id}/sub-recipes",
        json={"child_recipe_id": child_recipe_id, "quantity": 1, "unit": "portion"},
    ).json()

    outlet_id = _create_outlet(client, "Main Brand", "MB")
    spare_outlet_id = _create_outlet(client, "Spare Brand", "SB")
    client.post(f"/api/v1/recipes/{recipe_id}/outlets", json={"outlet_id": outlet_id})

    image = client.post(
        f"/api/v1/recipe-images/{recipe_id}",
        json={"image_base64": "aGVsbG8="},
    ).json()

    category = client.post("/api/v1/recipe-categories", json={"name": "Mains"}).json()
    category_link = client.post(
        "/api/v1/recipe-recipe-categories",
        json={"recipe_id": recipe_id, "category_id": category["id"], "is_active": True},
    ).json()

    return Dish(
        recipe_id=recipe_id,
        child_recipe_id=child_recipe_id,
        recipe_ingredient_id=recipe_ingredient["id"],
        spare_ingredient_id=spare_ingredient["id"],
        sub_recipe_link_id=link["id"],
        outlet_id=outlet_id,
        spare_outlet_id=spare_outlet_id,
        image_id=image["id"],
        category_id=category["id"],
        category_link_id=category_link["id"],
    )


# Each route: (method, url builder, json body builder). Bodies are valid so the guard is
# the only thing that can fail for a non-editor.
GUARDED_ROUTES: dict[
    str, tuple[str, Callable[[Dish], str], Callable[[Dish], dict | None]]
] = {
    "update_recipe": (
        "PATCH",
        lambda d: f"/api/v1/recipes/{d.recipe_id}",
        lambda d: {"name": "Renamed"},
    ),
    "update_status": (
        "PATCH",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/status",
        lambda d: {"status": "active"},
    ),
    "delete_recipe": (
        "DELETE",
        lambda d: f"/api/v1/recipes/{d.recipe_id}",
        lambda d: None,
    ),
    "add_ingredient": (
        "POST",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/ingredients",
        lambda d: {"ingredient_id": d.spare_ingredient_id, "quantity": 1, "unit": "g"},
    ),
    "update_ingredient": (
        "PATCH",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/ingredients/{d.recipe_ingredient_id}",
        lambda d: {"quantity": 250},
    ),
    "remove_ingredient": (
        "DELETE",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/ingredients/{d.recipe_ingredient_id}",
        lambda d: None,
    ),
    "update_sub_recipe": (
        "PUT",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/sub-recipes/{d.sub_recipe_link_id}",
        lambda d: {"quantity": 2},
    ),
    "remove_sub_recipe": (
        "DELETE",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/sub-recipes/{d.sub_recipe_link_id}",
        lambda d: None,
    ),
    "reorder_sub_recipes": (
        "POST",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/sub-recipes/reorder",
        lambda d: {"ordered_ids": [d.sub_recipe_link_id]},
    ),
    "store_raw_instructions": (
        "POST",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/instructions/raw",
        lambda d: {"text": "Mix and bake."},
    ),
    "update_structured_instructions": (
        "PATCH",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/instructions/structured",
        lambda d: {"steps": []},
    ),
    "recompute_cost": (
        "POST",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/costing/recompute",
        lambda d: None,
    ),
    "add_outlet": (
        "POST",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/outlets",
        lambda d: {"outlet_id": d.spare_outlet_id},
    ),
    "update_outlet": (
        "PATCH",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/outlets/{d.outlet_id}",
        lambda d: {"is_active": False},
    ),
    "remove_outlet": (
        "DELETE",
        lambda d: f"/api/v1/recipes/{d.recipe_id}/outlets/{d.outlet_id}",
        lambda d: None,
    ),
    "add_image": (
        "POST",
        lambda d: f"/api/v1/recipe-images/{d.recipe_id}",
        lambda d: {"image_base64": "aGVsbG8="},
    ),
    "reorder_images": (
        "PATCH",
        lambda d: f"/api/v1/recipe-images/{d.recipe_id}",
        lambda d: {"images": [{"id": d.image_id, "order": 0}]},
    ),
    "set_main_image": (
        "PATCH",
        lambda d: f"/api/v1/recipe-images/main/{d.image_id}",
        lambda d: None,
    ),
    "delete_image": (
        "DELETE",
        lambda d: f"/api/v1/recipe-images/{d.image_id}",
        lambda d: None,
    ),
    "add_category_link": (
        "POST",
        lambda d: "/api/v1/recipe-recipe-categories",
        lambda d: {
            "recipe_id": d.recipe_id,
            "category_id": d.category_id,
            "is_active": True,
        },
    ),
    "update_category_link": (
        "PATCH",
        lambda d: f"/api/v1/recipe-recipe-categories/{d.category_link_id}",
        lambda d: {"is_active": False},
    ),
    "delete_category_link": (
        "DELETE",
        lambda d: f"/api/v1/recipe-recipe-categories/{d.category_link_id}",
        lambda d: None,
    ),
    "delete_all_category_links": (
        "DELETE",
        lambda d: f"/api/v1/recipe-recipe-categories/recipe/{d.recipe_id}",
        lambda d: None,
    ),
}


def _call(client: TestClient, route: str, dish: Dish):
    method, url, body = GUARDED_ROUTES[route]
    payload = body(dish)
    if payload is None:
        return client.request(method, url(dish))
    return client.request(method, url(dish), json=payload)


@pytest.mark.parametrize("route", GUARDED_ROUTES)
@pytest.mark.parametrize("role", ["owner", "admin"])
def test_editor_may_change_dish(
    client: TestClient, act_as, dish: Dish, route: str, role: str
):
    act_as(role)
    response = _call(client, route, dish)
    assert response.status_code < 300, response.text


@pytest.mark.parametrize("route", GUARDED_ROUTES)
def test_other_user_gets_403(client: TestClient, act_as, dish: Dish, route: str):
    act_as("other")
    response = _call(client, route, dish)
    assert response.status_code == 403, response.text


def test_other_user_cannot_parse_instructions(client: TestClient, act_as, dish: Dish):
    """Parsing calls the LLM, so only the guard outcome is checked here."""
    act_as("other")
    response = client.post(f"/api/v1/recipes/{dish.recipe_id}/instructions/parse")
    assert response.status_code == 403


def test_owner_passes_parse_instructions_guard(client: TestClient, act_as, dish: Dish):
    """With no raw instructions the owner reaches the handler's 400, not a 403."""
    act_as("owner")
    response = client.post(f"/api/v1/recipes/{dish.recipe_id}/instructions/parse")
    assert response.status_code == 400


def test_other_user_change_leaves_dish_untouched(
    client: TestClient, act_as, dish: Dish
):
    act_as("other")
    client.patch(f"/api/v1/recipes/{dish.recipe_id}", json={"name": "Hijacked"})
    client.delete(f"/api/v1/recipes/{dish.recipe_id}")

    act_as("owner")
    recipe = client.get(f"/api/v1/recipes/{dish.recipe_id}").json()
    assert recipe["name"] == "Owned Dish"
    assert recipe["status"] == "draft"


@pytest.mark.parametrize("method", ["PATCH", "DELETE"])
def test_missing_dish_is_404(client: TestClient, act_as, users, method: str):
    act_as("other")
    kwargs = {"json": {"name": "x"}} if method == "PATCH" else {}
    response = client.request(method, f"/api/v1/recipes/{MISSING_RECIPE_ID}", **kwargs)
    assert response.status_code == 404


def test_missing_dish_status_is_404(client: TestClient, act_as, users):
    act_as("owner")
    response = client.patch(
        f"/api/v1/recipes/{MISSING_RECIPE_ID}/status", json={"status": "active"}
    )
    assert response.status_code == 404


def test_cannot_edit_another_dishs_ingredient_through_own_dish(
    client: TestClient, act_as, dish: Dish
):
    """Regression: the ingredient row id must belong to the recipe in the path."""
    act_as("other")
    own_recipe_id = _create_recipe(client, "Other's Dish", OTHER_ID)
    url = f"/api/v1/recipes/{own_recipe_id}/ingredients/{dish.recipe_ingredient_id}"

    assert client.patch(url, json={"quantity": 1}).status_code == 404
    assert client.delete(url).status_code == 404


def test_cannot_edit_another_dishs_sub_recipe_through_own_dish(
    client: TestClient, act_as, dish: Dish
):
    """Regression: the sub-recipe link id must belong to the recipe in the path."""
    act_as("other")
    own_recipe_id = _create_recipe(client, "Other's Dish", OTHER_ID)
    url = f"/api/v1/recipes/{own_recipe_id}/sub-recipes/{dish.sub_recipe_link_id}"

    assert client.put(url, json={"quantity": 9}).status_code == 404
    assert client.delete(url).status_code == 404


def test_other_user_cannot_fork_private_dish(client: TestClient, act_as, dish: Dish):
    act_as("other")
    response = client.post(f"/api/v1/recipes/{dish.recipe_id}/fork")
    assert response.status_code == 403


def test_fork_by_normal_user_is_owned_by_caller(client: TestClient, act_as, users):
    """The new owner comes from the token, not from the request body."""
    act_as("admin")
    public_id = _create_recipe(client, "Public Dish", OWNER_ID, is_public=True)

    act_as("other")
    response = client.post(
        f"/api/v1/recipes/{public_id}/fork", json={"new_owner_id": OWNER_ID}
    )
    assert response.status_code == 201
    assert response.json()["owner_id"] == OTHER_ID


def test_owner_may_fork_own_dish(client: TestClient, act_as, dish: Dish):
    act_as("owner")
    response = client.post(f"/api/v1/recipes/{dish.recipe_id}/fork")
    assert response.status_code == 201
    assert response.json()["owner_id"] == OWNER_ID


def test_admin_may_fork_on_behalf_of_another_user(
    client: TestClient, act_as, dish: Dish
):
    act_as("admin")
    response = client.post(
        f"/api/v1/recipes/{dish.recipe_id}/fork", json={"new_owner_id": OTHER_ID}
    )
    assert response.status_code == 201
    assert response.json()["owner_id"] == OTHER_ID
