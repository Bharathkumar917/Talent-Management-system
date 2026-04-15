"""User CRUD tests."""
import pytest


class TestListUsers:
    def test_list_users_as_admin(self, client, auth_headers, admin_user):
        res = client.get("/api/users", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "users" in data
        assert data["total"] >= 1

    def test_list_users_as_viewer_forbidden(self, client, viewer_token):
        res = client.get("/api/users", headers={"Authorization": f"Bearer {viewer_token}"})
        assert res.status_code == 403

    def test_list_users_search(self, client, auth_headers, admin_user):
        res = client.get("/api/users?search=Admin", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()["users"]) >= 1

    def test_list_users_role_filter(self, client, auth_headers, admin_user, viewer_user):
        res = client.get("/api/users?role=viewer", headers=auth_headers)
        assert res.status_code == 200
        for u in res.json()["users"]:
            assert u["role"] == "viewer"


class TestGetUser:
    def test_get_user_by_id(self, client, auth_headers, admin_user):
        res = client.get(f"/api/users/{admin_user.id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "admin@test.com"

    def test_get_nonexistent_user(self, client, auth_headers):
        import uuid
        res = client.get(f"/api/users/{uuid.uuid4()}", headers=auth_headers)
        assert res.status_code == 404


class TestUpdateUser:
    def test_admin_update_user_role(self, client, auth_headers, viewer_user):
        res = client.put(f"/api/users/{viewer_user.id}",
            headers=auth_headers,
            json={"role": "contributor"},
        )
        assert res.status_code == 200
        assert res.json()["role"] == "contributor"

    def test_viewer_cannot_change_own_role(self, client, viewer_token, viewer_user):
        res = client.put(f"/api/users/{viewer_user.id}",
            headers={"Authorization": f"Bearer {viewer_token}"},
            json={"role": "admin"},
        )
        assert res.status_code == 403

    def test_viewer_can_update_own_name(self, client, viewer_token, viewer_user):
        res = client.put(f"/api/users/{viewer_user.id}",
            headers={"Authorization": f"Bearer {viewer_token}"},
            json={"name": "Updated Name"},
        )
        assert res.status_code == 200
        assert res.json()["name"] == "Updated Name"


class TestDeleteUser:
    def test_admin_deactivate_user(self, client, auth_headers, viewer_user):
        res = client.delete(f"/api/users/{viewer_user.id}", headers=auth_headers)
        assert res.status_code == 200

    def test_viewer_cannot_delete(self, client, viewer_token, admin_user):
        res = client.delete(f"/api/users/{admin_user.id}",
            headers={"Authorization": f"Bearer {viewer_token}"})
        assert res.status_code == 403
