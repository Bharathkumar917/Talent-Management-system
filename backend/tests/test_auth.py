"""Authentication tests — register, login, profile, edge cases."""
import pytest


class TestRegister:
    def test_register_success(self, client):
        res = client.post("/api/auth/register", json={
            "name": "New User", "email": "new@test.com",
            "password": "SecurePass123", "role": "viewer",
        })
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["name"] == "New User"
        assert data["user"]["email"] == "new@test.com"
        assert data["user"]["role"] == "viewer"

    def test_register_duplicate_email(self, client, admin_user):
        res = client.post("/api/auth/register", json={
            "name": "Duplicate", "email": "admin@test.com",
            "password": "SecurePass123", "role": "viewer",
        })
        assert res.status_code == 409

    def test_register_short_password(self, client):
        res = client.post("/api/auth/register", json={
            "name": "Short", "email": "short@test.com",
            "password": "short", "role": "viewer",
        })
        assert res.status_code == 422

    def test_register_invalid_role(self, client):
        res = client.post("/api/auth/register", json={
            "name": "Invalid", "email": "invalid@test.com",
            "password": "SecurePass123", "role": "superuser",
        })
        assert res.status_code == 422

    def test_register_missing_fields(self, client):
        res = client.post("/api/auth/register", json={"name": "Incomplete"})
        assert res.status_code == 422


class TestLogin:
    def test_login_success(self, client, admin_user):
        res = client.post("/api/auth/login", json={
            "email": "admin@test.com", "password": "TestPassword123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@test.com"

    def test_login_wrong_password(self, client, admin_user):
        res = client.post("/api/auth/login", json={
            "email": "admin@test.com", "password": "WrongPassword",
        })
        assert res.status_code == 400

    def test_login_nonexistent_user(self, client):
        res = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "TestPassword123",
        })
        assert res.status_code == 400

    def test_login_deactivated_user(self, client, db_session, admin_user):
        admin_user.is_active = False
        db_session.commit()
        res = client.post("/api/auth/login", json={
            "email": "admin@test.com", "password": "TestPassword123",
        })
        assert res.status_code == 400


class TestProfile:
    def test_get_profile(self, client, auth_headers):
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "admin@test.com"

    def test_get_profile_no_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 403

    def test_get_profile_invalid_token(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})
        assert res.status_code == 401
