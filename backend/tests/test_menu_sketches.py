"""Tests for menu sketch endpoints."""

from fastapi.testclient import TestClient


BASE = "/api/v1/menu-sketches"

SAMPLE_SECTIONS = [
    {
        "name": "Starters",
        "dishes": [
            {
                "name": "Soup of the Day",
                "ingredients": ["chicken stock", "cream"],
                "sales_price": 12.0,
                "cost_price": 3.5,
            }
        ],
    }
]


# =============================================================================
# Create
# =============================================================================


def test_create_sketch_defaults(client: TestClient):
    """Creating without a name uses 'Untitled Menu' and starts at version 1."""
    response = client.post(BASE, json={})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Untitled Menu"
    assert data["version"] == 1
    assert data["sections"] == []
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_sketch_with_name(client: TestClient):
    """Creating with an explicit name stores it correctly."""
    response = client.post(BASE, json={"name": "Summer Menu"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Summer Menu"
    assert data["version"] == 1


# =============================================================================
# Read
# =============================================================================


def test_get_sketch(client: TestClient):
    """Retrieve a single sketch by ID."""
    sketch_id = client.post(BASE, json={"name": "Fetch Me"}).json()["id"]

    response = client.get(f"{BASE}/{sketch_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Fetch Me"


def test_get_sketch_not_found(client: TestClient):
    """Non-existent sketch returns 404."""
    response = client.get(f"{BASE}/99999")
    assert response.status_code == 404
    assert "Sketch not found" in response.json()["detail"]


def test_list_sketches_empty(client: TestClient):
    """List returns an empty array when no sketches exist."""
    response = client.get(BASE)
    assert response.status_code == 200
    assert response.json() == []


def test_list_sketches_returns_all(client: TestClient):
    """List returns all created sketches."""
    client.post(BASE, json={"name": "A"})
    client.post(BASE, json={"name": "B"})
    client.post(BASE, json={"name": "C"})

    response = client.get(BASE)
    assert response.status_code == 200
    names = {s["name"] for s in response.json()}
    assert names == {"A", "B", "C"}


# =============================================================================
# Update
# =============================================================================


def test_update_sketch_name(client: TestClient):
    """Patching the name updates it and leaves sections intact."""
    sketch_id = client.post(BASE, json={"name": "Old Name"}).json()["id"]

    response = client.patch(f"{BASE}/{sketch_id}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["sections"] == []


def test_update_sketch_sections(client: TestClient):
    """Patching sections persists the full nested structure."""
    sketch_id = client.post(BASE, json={}).json()["id"]

    response = client.patch(
        f"{BASE}/{sketch_id}", json={"sections": SAMPLE_SECTIONS}
    )
    assert response.status_code == 200
    sections = response.json()["sections"]
    assert len(sections) == 1
    assert sections[0]["name"] == "Starters"
    assert len(sections[0]["dishes"]) == 1
    assert sections[0]["dishes"][0]["name"] == "Soup of the Day"
    assert sections[0]["dishes"][0]["sales_price"] == 12.0
    assert sections[0]["dishes"][0]["cost_price"] == 3.5
    assert sections[0]["dishes"][0]["ingredients"] == ["chicken stock", "cream"]


def test_update_sketch_partial(client: TestClient):
    """Patching with only some fields leaves unspecified fields unchanged."""
    sketch_id = client.post(BASE, json={"name": "Keep Me"}).json()["id"]
    # First set sections via a PATCH
    client.patch(f"{BASE}/{sketch_id}", json={"sections": SAMPLE_SECTIONS})
    # Then patch only the name — sections must stay intact
    response = client.patch(f"{BASE}/{sketch_id}", json={"name": "Renamed"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Renamed"
    assert len(data["sections"]) == 1


def test_update_sketch_not_found(client: TestClient):
    """Patching a non-existent sketch returns 404."""
    response = client.patch(f"{BASE}/99999", json={"name": "Ghost"})
    assert response.status_code == 404
    assert "Sketch not found" in response.json()["detail"]


# =============================================================================
# Fork
# =============================================================================


def test_fork_sketch_increments_version(client: TestClient):
    """Fork creates a new sketch with version incremented by 1."""
    original = client.post(BASE, json={"name": "Original"}).json()
    assert original["version"] == 1

    response = client.post(f"{BASE}/{original['id']}/fork")
    assert response.status_code == 201
    forked = response.json()
    assert forked["version"] == 2
    assert forked["id"] != original["id"]


def test_fork_sketch_copies_name_and_sections(client: TestClient):
    """Fork preserves name and sections from the source sketch."""
    sketch_id = client.post(
        BASE, json={"name": "Tasty Menu"}
    ).json()["id"]
    client.patch(f"{BASE}/{sketch_id}", json={"sections": SAMPLE_SECTIONS})

    forked = client.post(f"{BASE}/{sketch_id}/fork").json()
    assert forked["name"] == "Tasty Menu"
    assert len(forked["sections"]) == 1
    assert forked["sections"][0]["name"] == "Starters"


def test_fork_sketch_is_independent(client: TestClient):
    """Updating the fork does not affect the original sketch."""
    original_id = client.post(BASE, json={"name": "Base"}).json()["id"]
    forked_id = client.post(f"{BASE}/{original_id}/fork").json()["id"]

    client.patch(f"{BASE}/{forked_id}", json={"name": "Fork Renamed"})

    original = client.get(f"{BASE}/{original_id}").json()
    assert original["name"] == "Base"


def test_fork_sketch_not_found(client: TestClient):
    """Forking a non-existent sketch returns 404."""
    response = client.post(f"{BASE}/99999/fork")
    assert response.status_code == 404
    assert "Sketch not found" in response.json()["detail"]


def test_fork_multiple_times_increments_correctly(client: TestClient):
    """Successive forks keep incrementing the version number."""
    v1_id = client.post(BASE, json={"name": "Menu"}).json()["id"]
    v2 = client.post(f"{BASE}/{v1_id}/fork").json()
    assert v2["version"] == 2

    v3 = client.post(f"{BASE}/{v2['id']}/fork").json()
    assert v3["version"] == 3


# =============================================================================
# Delete
# =============================================================================


def test_delete_sketch(client: TestClient):
    """Deleting a sketch returns 204 and it no longer appears in the list."""
    sketch_id = client.post(BASE, json={"name": "Delete Me"}).json()["id"]

    response = client.delete(f"{BASE}/{sketch_id}")
    assert response.status_code == 204
    assert response.content == b""

    # Confirm it is gone
    assert client.get(f"{BASE}/{sketch_id}").status_code == 404


def test_delete_sketch_removed_from_list(client: TestClient):
    """Deleted sketch no longer appears in the list endpoint."""
    id_a = client.post(BASE, json={"name": "Keep"}).json()["id"]
    id_b = client.post(BASE, json={"name": "Remove"}).json()["id"]

    client.delete(f"{BASE}/{id_b}")

    ids = {s["id"] for s in client.get(BASE).json()}
    assert id_a in ids
    assert id_b not in ids


def test_delete_sketch_not_found(client: TestClient):
    """Deleting a non-existent sketch returns 404."""
    response = client.delete(f"{BASE}/99999")
    assert response.status_code == 404
    assert "Sketch not found" in response.json()["detail"]


def test_delete_sketch_idempotent_second_call(client: TestClient):
    """Deleting the same sketch twice returns 404 on the second call."""
    sketch_id = client.post(BASE, json={"name": "Once Only"}).json()["id"]

    client.delete(f"{BASE}/{sketch_id}")
    response = client.delete(f"{BASE}/{sketch_id}")
    assert response.status_code == 404
