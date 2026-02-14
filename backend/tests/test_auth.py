"""Tests for authentication endpoints."""
import pytest

from backend.tests.conftest import auth_headers


class TestRegister:
    async def test_register_success(self, client):
        resp = await client.post("/auth/register", json={
            "email": "newuser@example.com",
            "password": "securepass123"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client):
        payload = {"email": "dup@example.com", "password": "securepass123"}
        resp1 = await client.post("/auth/register", json=payload)
        assert resp1.status_code == 201
        resp2 = await client.post("/auth/register", json=payload)
        assert resp2.status_code == 400
        assert "already registered" in resp2.json()["detail"]

    async def test_register_short_password(self, client):
        resp = await client.post("/auth/register", json={
            "email": "short@example.com",
            "password": "short"
        })
        assert resp.status_code == 422  # Pydantic validation


class TestLogin:
    async def test_login_success(self, client):
        await client.post("/auth/register", json={
            "email": "login@example.com", "password": "securepass123"
        })
        resp = await client.post("/auth/login", json={
            "email": "login@example.com", "password": "securepass123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client):
        await client.post("/auth/register", json={
            "email": "wrongpw@example.com", "password": "securepass123"
        })
        resp = await client.post("/auth/login", json={
            "email": "wrongpw@example.com", "password": "badpassword"
        })
        assert resp.status_code == 401
        assert "Invalid email or password" in resp.json()["detail"]

    async def test_login_nonexistent_user(self, client):
        resp = await client.post("/auth/login", json={
            "email": "nobody@example.com", "password": "securepass123"
        })
        assert resp.status_code == 401


class TestRefresh:
    async def test_refresh_success(self, client):
        reg = await client.post("/auth/register", json={
            "email": "refresh@example.com", "password": "securepass123"
        })
        old_refresh = reg.json()["refresh_token"]
        resp = await client.post("/auth/refresh", json={
            "refresh_token": old_refresh
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["refresh_token"] != old_refresh

    async def test_refresh_invalid_token(self, client):
        resp = await client.post("/auth/refresh", json={
            "refresh_token": "invalid-token-string"
        })
        assert resp.status_code == 401


class TestMe:
    async def test_me_authenticated(self, client, test_user):
        user, token = test_user
        resp = await client.get("/auth/me", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == user.email
        assert data["is_active"] is True

    async def test_me_no_token(self, client):
        resp = await client.get("/auth/me")
        assert resp.status_code == 403


class TestLogout:
    async def test_logout_revokes_refresh(self, client):
        reg = await client.post("/auth/register", json={
            "email": "logout@example.com", "password": "securepass123"
        })
        tokens = reg.json()
        resp = await client.post(
            "/auth/logout",
            headers=auth_headers(tokens["access_token"])
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Successfully logged out"

        # Refresh token should now be revoked
        resp = await client.post("/auth/refresh", json={
            "refresh_token": tokens["refresh_token"]
        })
        assert resp.status_code == 401
