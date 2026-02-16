"""Tests for Lesson 2: Feedback Analyzer endpoints."""
import pytest

from backend.tests.conftest import auth_headers


FEEDBACK_PAYLOAD = {
    "feedback": "This code doesn't work right.",
    "context": "Reviewing a Python function",
    "category": "code",
}

GOOD_FEEDBACK_PAYLOAD = {
    "feedback": "The error handling in the process_order function on line 156 catches all exceptions with a bare except clause. Change it to catch specific exceptions (ValueError, KeyError) because bare excepts hide bugs.",
    "context": "Code review feedback",
    "category": "code",
}


class TestFeedbackAnalyze:
    async def test_analyze_feedback(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson2/analyze",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "quality_score" in data
        assert "quality_level" in data
        assert "issues" in data
        assert "strengths" in data

    async def test_analyze_good_feedback(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson2/analyze",
            json=GOOD_FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["quality_level"] == "specific"
        assert data["quality_score"] >= 8

    async def test_analyze_requires_auth(self, client):
        resp = await client.post("/lesson2/analyze", json=FEEDBACK_PAYLOAD)
        assert resp.status_code == 403


class TestFeedbackEntryCRUD:
    async def test_create_entry(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["original_feedback"] == FEEDBACK_PAYLOAD["feedback"]
        assert "analysis" in data
        assert "id" in data

    async def test_list_entries(self, client, test_user):
        _, token = test_user
        # Create an entry first
        await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson2/entries", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1

    async def test_get_entry(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        entry_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson2/entries/{entry_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == entry_id

    async def test_update_entry(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        entry_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson2/entries/{entry_id}",
            json={"rewritten_feedback": "Better feedback here", "is_example": True},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["rewritten_feedback"] == "Better feedback here"
        assert resp.json()["is_example"] is True

    async def test_delete_entry(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        entry_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson2/entries/{entry_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        # Verify gone
        resp = await client.get(
            f"/lesson2/entries/{entry_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_entry_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson2/entries/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestFeedbackStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson2/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] == 0

    async def test_stats_with_entries(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson2/entries",
            json=FEEDBACK_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson2/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] == 1


class TestFeedbackReference:
    async def test_get_patterns(self, client):
        resp = await client.get("/lesson2/patterns")
        assert resp.status_code == 200
        data = resp.json()
        assert "no_specifics" in data

    async def test_get_quality_levels(self, client):
        resp = await client.get("/lesson2/quality-levels")
        assert resp.status_code == 200

    async def test_get_categories(self, client):
        resp = await client.get("/lesson2/categories")
        assert resp.status_code == 200
