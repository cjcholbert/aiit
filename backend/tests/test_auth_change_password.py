"""Tests for the change-password endpoint."""
import pytest

from backend.tests.conftest import auth_headers


class TestChangePassword:
    async def test_change_password_success(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/auth/change-password",
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword456",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Password changed successfully"

        # Verify new password works by logging in
        login_resp = await client.post(
            "/auth/login",
            json={"email": "testuser@example.com", "password": "newpassword456"},
        )
        assert login_resp.status_code == 200

    async def test_change_password_wrong_current(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/auth/change-password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 400
        assert "incorrect" in resp.json()["detail"].lower()

    async def test_change_password_too_short(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/auth/change-password",
            json={
                "current_password": "testpassword123",
                "new_password": "short",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 422  # pydantic validation

    async def test_change_password_requires_auth(self, client):
        resp = await client.post(
            "/auth/change-password",
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword456",
            },
        )
        assert resp.status_code == 403
