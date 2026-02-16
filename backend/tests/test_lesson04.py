"""Tests for Lesson 4: Context Docs endpoints."""
import pytest

from backend.tests.conftest import auth_headers


DOC_PAYLOAD = {
    "project_name": "Test API Project",
    "description": "Migrating REST API from v1 to v2",
    "key_decisions": [
        {"decision": "Use versioned URLs", "reasoning": "Easier for clients"}
    ],
    "known_issues": [
        {"issue": "Rate limiting inconsistent", "workaround": "Document differences", "status": "open"}
    ],
    "lessons_learned": [
        {"lesson": "Start with schema validation", "context": "Found edge cases late"}
    ],
    "next_goals": [
        {"goal": "Complete migration", "priority": "high"}
    ],
}

SESSION_PAYLOAD_TEMPLATE = {
    "goals": ["Complete endpoint migration", "Write tests"],
    "notes": "Starting fresh session",
}


class TestContextDocCRUD:
    async def test_create_doc(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_name"] == "Test API Project"
        assert data["version"] == 1
        assert "id" in data

    async def test_list_docs(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson4/docs", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_doc(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson4/docs/{doc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == doc_id

    async def test_update_doc(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson4/docs/{doc_id}",
            json={"project_name": "Updated Project", "is_active": False},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["project_name"] == "Updated Project"
        assert resp.json()["is_active"] is False

    async def test_delete_doc(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson4/docs/{doc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson4/docs/{doc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_doc_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson4/docs/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestContextSessionCRUD:
    async def test_create_session(self, client, test_user):
        _, token = test_user
        doc_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = doc_resp.json()["id"]

        payload = {**SESSION_PAYLOAD_TEMPLATE, "context_doc_id": doc_id}
        resp = await client.post(
            "/lesson4/sessions",
            json=payload,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["context_doc_id"] == doc_id
        assert data["goals"] == SESSION_PAYLOAD_TEMPLATE["goals"]

    async def test_list_sessions(self, client, test_user):
        _, token = test_user
        doc_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = doc_resp.json()["id"]
        payload = {**SESSION_PAYLOAD_TEMPLATE, "context_doc_id": doc_id}
        await client.post(
            "/lesson4/sessions",
            json=payload,
            headers=auth_headers(token),
        )

        resp = await client.get(
            "/lesson4/sessions", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_end_session(self, client, test_user):
        _, token = test_user
        doc_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = doc_resp.json()["id"]
        payload = {**SESSION_PAYLOAD_TEMPLATE, "context_doc_id": doc_id}
        session_resp = await client.post(
            "/lesson4/sessions",
            json=payload,
            headers=auth_headers(token),
        )
        session_id = session_resp.json()["id"]

        resp = await client.post(
            f"/lesson4/sessions/{session_id}/end",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["ended_at"] is not None

    async def test_delete_session(self, client, test_user):
        _, token = test_user
        doc_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = doc_resp.json()["id"]
        payload = {**SESSION_PAYLOAD_TEMPLATE, "context_doc_id": doc_id}
        session_resp = await client.post(
            "/lesson4/sessions",
            json=payload,
            headers=auth_headers(token),
        )
        session_id = session_resp.json()["id"]

        resp = await client.delete(
            f"/lesson4/sessions/{session_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

    async def test_session_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson4/sessions/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestContextDocsStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson4/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_docs"] == 0
        assert data["total_sessions"] == 0


class TestContextDocsPrompt:
    async def test_generate_prompt(self, client, test_user):
        _, token = test_user
        doc_resp = await client.post(
            "/lesson4/docs",
            json=DOC_PAYLOAD,
            headers=auth_headers(token),
        )
        doc_id = doc_resp.json()["id"]

        resp = await client.post(
            "/lesson4/generate-prompt",
            json={"context_doc_id": doc_id},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "prompt" in data
        assert "Test API Project" in data["prompt"]
