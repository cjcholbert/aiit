"""Tests for Lesson 7: Task Decomposer endpoints."""
import pytest

from backend.tests.conftest import auth_headers


DECOMPOSITION_PAYLOAD = {
    "project_name": "Build REST API Endpoint",
    "description": "Create a new API endpoint for user profiles",
    "tasks": [
        {
            "title": "Research existing patterns",
            "description": "Look at how similar endpoints work",
            "category": "ai_optimal",
            "reasoning": "Pattern-based research",
        },
        {
            "title": "Design endpoint structure",
            "description": "Decide on routes and methods",
            "category": "collaborative",
            "reasoning": "Needs judgment on trade-offs",
            "is_decision_gate": True,
        },
        {
            "title": "Code review and approval",
            "description": "Get team sign-off",
            "category": "human_primary",
            "reasoning": "Requires authority",
        },
    ],
}


class TestDecompositionCRUD:
    async def test_create_decomposition(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_name"] == "Build REST API Endpoint"
        assert len(data["tasks"]) == 3
        assert data["categories"]["ai_optimal"] == 1
        assert data["categories"]["collaborative"] == 1
        assert data["categories"]["human_primary"] == 1

    async def test_list_decompositions(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson7/decompositions", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["task_count"] == 3

    async def test_get_decomposition(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        decomp_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson7/decompositions/{decomp_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == decomp_id

    async def test_update_decomposition(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        decomp_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson7/decompositions/{decomp_id}",
            json={"project_name": "Updated Project"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["project_name"] == "Updated Project"

    async def test_delete_decomposition(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        decomp_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson7/decompositions/{decomp_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson7/decompositions/{decomp_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_decomposition_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson7/decompositions/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestDecompositionTasks:
    async def test_add_task(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        decomp_id = create_resp.json()["id"]

        resp = await client.post(
            f"/lesson7/decompositions/{decomp_id}/tasks",
            json={
                "title": "Write tests",
                "description": "Create unit tests",
                "category": "ai_optimal",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert len(resp.json()["tasks"]) == 4


class TestDecompositionStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson7/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_decompositions"] == 0
        assert data["total_tasks"] == 0

    async def test_stats_with_data(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson7/decompositions",
            json=DECOMPOSITION_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson7/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_decompositions"] == 1
        assert data["total_tasks"] == 3


class TestDecompositionRequiresAuth:
    async def test_requires_auth(self, client):
        resp = await client.get("/lesson7/decompositions")
        assert resp.status_code == 403
