"""Archived (soft-deleted) recipes leave the default recipe list."""

from fastapi.testclient import TestClient


def _create(client: TestClient, name: str) -> int:
    response = client.post(
        "/api/v1/recipes",
        json={"name": name, "yield_quantity": 1, "yield_unit": "portion"},
    )
    return response.json()["id"]


def _names(client: TestClient, query: str = "") -> list[str]:
    response = client.get(f"/api/v1/recipes{query}")
    assert response.status_code == 200
    return [item["name"] for item in response.json()["items"]]


def test_deleted_recipe_drops_out_of_default_list(client: TestClient):
    _create(client, "Kept Dish")
    deleted_id = _create(client, "Deleted Dish")

    client.delete(f"/api/v1/recipes/{deleted_id}")

    response = client.get("/api/v1/recipes")
    assert response.json()["total_count"] == 1
    assert _names(client) == ["Kept Dish"]


def test_deleted_recipe_excluded_from_search(client: TestClient):
    deleted_id = _create(client, "Deleted Laksa")
    client.delete(f"/api/v1/recipes/{deleted_id}")

    assert _names(client, "?search=laksa") == []


def test_archived_status_filter_lists_deleted_recipes(client: TestClient):
    _create(client, "Kept Dish")
    deleted_id = _create(client, "Deleted Dish")
    client.delete(f"/api/v1/recipes/{deleted_id}")

    assert _names(client, "?status=archived") == ["Deleted Dish"]


def test_include_archived_lists_every_recipe(client: TestClient):
    _create(client, "Kept Dish")
    deleted_id = _create(client, "Deleted Dish")
    client.delete(f"/api/v1/recipes/{deleted_id}")

    assert sorted(_names(client, "?include_archived=true")) == ["Deleted Dish", "Kept Dish"]


def test_restored_recipe_returns_to_default_list(client: TestClient):
    deleted_id = _create(client, "Restored Dish")
    client.delete(f"/api/v1/recipes/{deleted_id}")

    response = client.patch(f"/api/v1/recipes/{deleted_id}/status", json={"status": "draft"})
    assert response.status_code == 200

    assert _names(client) == ["Restored Dish"]


def test_deleted_recipe_still_readable_by_id(client: TestClient):
    deleted_id = _create(client, "Deleted Dish")
    client.delete(f"/api/v1/recipes/{deleted_id}")

    response = client.get(f"/api/v1/recipes/{deleted_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "archived"
