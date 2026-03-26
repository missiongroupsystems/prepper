"""Tests for GET /api/v1/supplier-ingredients (cross-supplier product listing)."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.deps import get_session, get_current_user
from app.database import get_session as db_get_session
from app.models import User, UserType


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def _make_client(session: Session, user: User):
    """Yield a TestClient authenticated as *user*."""
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[db_get_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: user

    storage_patches = [
        patch("app.api.recipe_images.is_storage_configured", return_value=True),
        patch("app.api.recipe_images.StorageService"),
    ]
    with storage_patches[0]:
        with storage_patches[1] as mock_storage_class:
            mock_storage = MagicMock()

            async def async_upload(*args, **kwargs):
                return "https://example.com/fake.png"

            mock_storage.upload_image_from_base64 = MagicMock(side_effect=async_upload)
            mock_storage_class.return_value = mock_storage
            yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture
def admin_user():
    return User(id="admin-1", email="admin@test.com", username="admin", user_type=UserType.ADMIN, outlet_id=None)


@pytest.fixture
def admin_client(session, admin_user):
    yield from _make_client(session, admin_user)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_outlet(client: TestClient, name: str, code: str, parent_id: int | None = None) -> int:
    data: dict = {"name": name, "code": code, "outlet_type": "brand"}
    if parent_id:
        data["parent_outlet_id"] = parent_id
    resp = client.post("/api/v1/outlets", json=data)
    assert resp.status_code == 201
    return resp.json()["id"]


def _create_category(client: TestClient, name: str) -> int:
    resp = client.post("/api/v1/categories", json={"name": name})
    assert resp.status_code == 201
    return resp.json()["id"]


def _create_ingredient(client: TestClient, name: str = "Tomato", category_id: int | None = None) -> int:
    body: dict = {"name": name, "base_unit": "kg"}
    if category_id:
        body["category_id"] = category_id
    resp = client.post("/api/v1/ingredients", json=body)
    assert resp.status_code == 201
    return resp.json()["id"]


def _create_supplier(client: TestClient, name: str = "Supplier A") -> int:
    resp = client.post("/api/v1/suppliers", json={"name": name})
    assert resp.status_code == 201
    return resp.json()["id"]


def _add_supplier_ingredient(
    client: TestClient,
    ing_id: int,
    sup_id: int,
    outlet_id: int,
    pack_unit: str = "kg",
    price: float = 10.0,
    sku: str | None = None,
) -> int:
    body: dict = {
        "ingredient_id": ing_id,
        "supplier_id": sup_id,
        "outlet_id": outlet_id,
        "pack_size": 5.0,
        "pack_unit": pack_unit,
        "price_per_pack": price,
    }
    if sku is not None:
        body["sku"] = sku
    resp = client.post(f"/api/v1/ingredients/{ing_id}/suppliers", json=body)
    assert resp.status_code == 201
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestSupplierIngredientsListEndpoint:
    """Tests for GET /api/v1/supplier-ingredients."""

    URL = "/api/v1/supplier-ingredients"

    # --- basic response shape ---

    def test_empty_when_no_data(self, admin_client: TestClient):
        """Returns empty paginated list when no supplier ingredients exist."""
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total_count"] == 0
        assert data["total_pages"] == 0
        assert data["page_number"] == 1

    def test_response_shape(self, session, admin_user, admin_client: TestClient):
        """Each item contains all expected fields."""
        outlet_id = _create_outlet(admin_client, "Shop A", "SA")
        cat_id = _create_category(admin_client, "Vegetables")
        ing_id = _create_ingredient(admin_client, "Carrot", category_id=cat_id)
        sup_id = _create_supplier(admin_client, "Farm Direct")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id, price=12.5, sku="CARR-001")

        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        item = resp.json()["items"][0]

        assert "id" in item
        assert item["ingredient_id"] == ing_id
        assert item["ingredient_name"] == "Carrot"
        assert item["category_name"] == "Vegetables"
        assert item["sku"] == "CARR-001"
        assert item["supplier_id"] == sup_id
        assert item["supplier_name"] == "Farm Direct"
        assert item["unit"] == "kg"
        assert item["price_per_pack"] == 12.5

    # --- admin visibility ---

    def test_admin_sees_all_entries(self, session, admin_user, admin_client: TestClient):
        """Admin user sees supplier ingredients from all outlets."""
        outlet_a = _create_outlet(admin_client, "Outlet A", "OA")
        outlet_b = _create_outlet(admin_client, "Outlet B", "OB")
        ing_a = _create_ingredient(admin_client, "Apple")
        ing_b = _create_ingredient(admin_client, "Banana")
        sup_a = _create_supplier(admin_client, "Sup A")
        sup_b = _create_supplier(admin_client, "Sup B")
        _add_supplier_ingredient(admin_client, ing_a, sup_a, outlet_a)
        _add_supplier_ingredient(admin_client, ing_b, sup_b, outlet_b)

        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert resp.json()["total_count"] == 2

    # --- access control ---

    def test_normal_user_no_outlet_sees_nothing(self, session, admin_client: TestClient):
        """Non-admin with no outlet_id gets an empty list."""
        outlet_id = _create_outlet(admin_client, "Outlet X", "OX")
        ing_id = _create_ingredient(admin_client, "Pepper")
        sup_id = _create_supplier(admin_client, "Pepper Farm")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        no_outlet_user = User(
            id="no-outlet", email="no@test.com", username="nooutlet",
            user_type=UserType.NORMAL, outlet_id=None,
        )
        for client in _make_client(session, no_outlet_user):
            resp = client.get(self.URL)
            assert resp.status_code == 200
            assert resp.json()["total_count"] == 0

    def test_normal_user_sees_own_outlet(self, session, admin_client: TestClient):
        """Non-admin user sees supplier ingredients assigned to their outlet."""
        outlet_id = _create_outlet(admin_client, "My Outlet", "MY")
        ing_id = _create_ingredient(admin_client, "Garlic")
        sup_id = _create_supplier(admin_client, "Herb Co")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        user = User(
            id="user-my", email="my@test.com", username="myuser",
            user_type=UserType.NORMAL, outlet_id=outlet_id,
        )
        for client in _make_client(session, user):
            resp = client.get(self.URL)
            assert resp.status_code == 200
            data = resp.json()
            assert data["total_count"] == 1
            assert data["items"][0]["ingredient_name"] == "Garlic"

    def test_cross_tree_isolation(self, session, admin_client: TestClient):
        """User in tree A cannot see supplier ingredients from tree B."""
        tree_a = _create_outlet(admin_client, "Tree A", "TA")
        tree_b = _create_outlet(admin_client, "Tree B", "TB")
        ing_id = _create_ingredient(admin_client, "Rice")
        sup_id = _create_supplier(admin_client, "Rice Co")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, tree_b)

        user_a = User(
            id="user-a", email="a@test.com", username="usera",
            user_type=UserType.NORMAL, outlet_id=tree_a,
        )
        for client in _make_client(session, user_a):
            resp = client.get(self.URL)
            assert resp.status_code == 200
            assert resp.json()["total_count"] == 0

    def test_child_user_sees_parent_outlet_entries(self, session, admin_client: TestClient):
        """User assigned to a child outlet can see supplier ingredients from the parent."""
        parent_id = _create_outlet(admin_client, "Parent Brand", "PB")
        child_id = _create_outlet(admin_client, "Child Location", "CL", parent_id=parent_id)
        ing_id = _create_ingredient(admin_client, "Onion")
        sup_id = _create_supplier(admin_client, "Onion Farm")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, parent_id)

        child_user = User(
            id="child-user", email="child@test.com", username="childuser",
            user_type=UserType.NORMAL, outlet_id=child_id,
        )
        for client in _make_client(session, child_user):
            resp = client.get(self.URL)
            assert resp.status_code == 200
            assert resp.json()["total_count"] == 1

    # --- search ---

    def test_search_by_ingredient_name(self, admin_client: TestClient):
        """search param filters by ingredient name (case-insensitive)."""
        outlet_id = _create_outlet(admin_client, "Shop S", "SS")
        ing_a = _create_ingredient(admin_client, "Chicken Breast")
        ing_b = _create_ingredient(admin_client, "Beef Tenderloin")
        sup = _create_supplier(admin_client, "Meat Co")
        _add_supplier_ingredient(admin_client, ing_a, sup, outlet_id)
        _add_supplier_ingredient(admin_client, ing_b, sup, outlet_id)

        resp = admin_client.get(self.URL, params={"search": "chicken"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_count"] == 1
        assert data["items"][0]["ingredient_name"] == "Chicken Breast"

    def test_search_by_sku(self, admin_client: TestClient):
        """search param filters by SKU (case-insensitive)."""
        outlet_id = _create_outlet(admin_client, "Shop K", "SK")
        ing_id = _create_ingredient(admin_client, "Salmon")
        sup_id = _create_supplier(admin_client, "Fish Market")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id, sku="FISH-SAL-001")

        resp = admin_client.get(self.URL, params={"search": "sal"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_count"] == 1
        assert data["items"][0]["sku"] == "FISH-SAL-001"

    def test_search_no_match_returns_empty(self, admin_client: TestClient):
        """search with no match returns an empty list."""
        outlet_id = _create_outlet(admin_client, "Shop E", "SE")
        ing_id = _create_ingredient(admin_client, "Milk")
        sup_id = _create_supplier(admin_client, "Dairy Co")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        resp = admin_client.get(self.URL, params={"search": "xyznotexist"})
        assert resp.status_code == 200
        assert resp.json()["total_count"] == 0

    # --- pagination ---

    def test_pagination_page_size(self, admin_client: TestClient):
        """page_size limits results per page."""
        outlet_id = _create_outlet(admin_client, "Shop P", "SP")
        sup_id = _create_supplier(admin_client, "Bulk Sup")
        for i in range(5):
            ing_id = _create_ingredient(admin_client, f"Ingredient {i}")
            _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        resp = admin_client.get(self.URL, params={"page_size": 3, "page_number": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_count"] == 5
        assert data["total_pages"] == 2
        assert len(data["items"]) == 3

    def test_pagination_second_page(self, admin_client: TestClient):
        """page_number=2 returns the second page of results."""
        outlet_id = _create_outlet(admin_client, "Shop Q", "SQ")
        sup_id = _create_supplier(admin_client, "Page Sup")
        for i in range(5):
            ing_id = _create_ingredient(admin_client, f"Product {i}")
            _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        resp = admin_client.get(self.URL, params={"page_size": 3, "page_number": 2})
        assert resp.status_code == 200
        data = resp.json()
        assert data["page_number"] == 2
        assert len(data["items"]) == 2

    def test_pagination_defaults(self, admin_client: TestClient):
        """Default page_number=1, page_size=20 are applied."""
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        data = resp.json()
        assert data["page_number"] == 1

    # --- category name ---

    def test_category_name_is_null_when_uncategorised(self, admin_client: TestClient):
        """category_name is None for ingredients without a category."""
        outlet_id = _create_outlet(admin_client, "Shop NC", "NC")
        ing_id = _create_ingredient(admin_client, "Mystery Herb")  # no category_id
        sup_id = _create_supplier(admin_client, "Herb Supply")
        _add_supplier_ingredient(admin_client, ing_id, sup_id, outlet_id)

        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        item = resp.json()["items"][0]
        assert item["category_name"] is None
