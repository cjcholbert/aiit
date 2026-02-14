"""Tests for Lesson 8: Delegation Tracker endpoints."""
import pytest

from backend.tests.conftest import auth_headers
from backend.modules.lesson08_delegation.schemas import (
    CriterionResult, DelegationReview,
)


DELEGATION_PAYLOAD = {
    "name": "Code Generation Workflow",
    "template": "## Context\nBuild a REST API.\n\n## Success Criteria\n- [ ] Code runs without errors\n- [ ] Tests pass",
    "task_sequence": [
        {
            "title": "Generate initial code",
            "description": "First pass at the implementation",
            "category": "ai_optimal",
            "status": "pending",
        },
        {
            "title": "Review and refine",
            "description": "Check output quality",
            "category": "collaborative",
            "status": "pending",
            "is_decision_gate": True,
        },
    ],
    "notes": "Test delegation",
}


class TestDelegationCRUD:
    async def test_create_delegation(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Code Generation Workflow"
        assert len(data["task_sequence"]) == 2
        assert data["task_sequence"][0]["title"] == "Generate initial code"

    async def test_list_delegations(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson8/delegations", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Code Generation Workflow"
        assert data[0]["task_count"] == 2

    async def test_get_delegation(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        deleg_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson8/delegations/{deleg_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == deleg_id

    async def test_update_delegation(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        deleg_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson8/delegations/{deleg_id}",
            json={"name": "Updated Workflow", "notes": "Updated notes"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Workflow"
        assert resp.json()["notes"] == "Updated notes"

    async def test_delete_delegation(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        deleg_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson8/delegations/{deleg_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        # Verify gone
        resp = await client.get(
            f"/lesson8/delegations/{deleg_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestDelegationAnalysis:
    async def test_analyze_task_output_with_mock(
        self, client, test_user, monkeypatch
    ):
        _, token = test_user

        # Create delegation with tasks
        create_resp = await client.post(
            "/lesson8/delegations",
            json=DELEGATION_PAYLOAD,
            headers=auth_headers(token),
        )
        deleg_id = create_resp.json()["id"]
        task_id = create_resp.json()["task_sequence"][0]["id"]

        mock_review = DelegationReview(
            overall_pass=True,
            criteria_results=[
                CriterionResult(
                    criterion="Code runs without errors",
                    passed=True,
                    reasoning="The code compiles and runs cleanly.",
                    confidence=0.9,
                ),
            ],
            summary="Output meets all success criteria.",
            suggestions=[],
            ai_extracted_output="def hello(): print('Hello, World!')",
        )

        async def mock_analyze(**kwargs):
            return mock_review

        monkeypatch.setattr(
            "backend.modules.lesson08_delegation.routes.analyze_delegation_output",
            mock_analyze,
        )

        resp = await client.post(
            f"/lesson8/delegations/{deleg_id}/tasks/{task_id}/analyze",
            json={"raw_output": "def hello(): print('Hello, World!')"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["overall_pass"] is True
        assert len(data["criteria_results"]) == 1


class TestDelegationStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson8/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_delegations"] == 0
        assert data["total_tasks"] == 0
