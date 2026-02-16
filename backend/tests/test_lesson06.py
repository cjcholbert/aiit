"""Tests for Lesson 6: Verification Tools endpoints."""
import pytest

from backend.tests.conftest import auth_headers


CHECKLIST_PAYLOAD = {
    "name": "Code Review Checklist",
    "output_type": "Code Syntax & Patterns",
    "items": [
        {"text": "Syntax is valid", "category": "critical", "is_critical": True},
        {"text": "No hardcoded credentials", "category": "critical", "is_critical": True},
        {"text": "Error handling present", "category": "edge_case", "is_critical": False},
    ],
}


class TestChecklistCRUD:
    async def test_create_checklist(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Code Review Checklist"
        assert len(data["items"]) == 3
        assert "id" in data

    async def test_list_checklists(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson6/checklists", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["item_count"] == 3

    async def test_get_checklist(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        cl_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson6/checklists/{cl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == cl_id

    async def test_update_checklist(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        cl_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson6/checklists/{cl_id}",
            json={"name": "Updated Checklist"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Checklist"

    async def test_delete_checklist(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        cl_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson6/checklists/{cl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson6/checklists/{cl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_checklist_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson6/checklists/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestVerificationSession:
    async def test_start_session(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        cl_id = create_resp.json()["id"]

        resp = await client.post(
            "/lesson6/sessions",
            json={
                "checklist_id": cl_id,
                "output_description": "Testing AI-generated code",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["checklist_id"] == cl_id
        assert data["completed"] is False


class TestVerificationStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson6/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checklists"] == 0
        assert data["total_sessions"] == 0


class TestSkipCriteria:
    async def test_update_skip_criteria(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson6/checklists",
            json=CHECKLIST_PAYLOAD,
            headers=auth_headers(token),
        )
        cl_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson6/checklists/{cl_id}/skip-criteria",
            json={
                "trust_level_threshold": "high",
                "allow_low_stakes": True,
                "allow_pattern_match": True,
                "allow_prototyping": True,
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["skip_criteria"] is not None
