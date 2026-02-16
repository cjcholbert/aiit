"""Tests for progress summary endpoint."""
import pytest

from backend.tests.conftest import auth_headers


class TestProgressSummary:
    async def test_progress_summary_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/progress/summary", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_count"] == 12
        assert data["completed_count"] == 0
        assert len(data["lessons"]) == 12

    async def test_progress_requires_auth(self, client):
        resp = await client.get("/progress/summary")
        assert resp.status_code == 403
