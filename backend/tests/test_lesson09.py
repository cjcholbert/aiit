"""Tests for Lesson 9: Iteration Passes endpoints."""
import pytest

from backend.tests.conftest import auth_headers


TASK_PAYLOAD = {
    "task_name": "API Error Handler Refactoring",
    "target_outcome": "Consolidated error handling with consistent format",
    "notes": "Test task for 70-85-95 progression",
}


class TestIterationTaskCRUD:
    async def test_create_task(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["task_name"] == "API Error Handler Refactoring"
        assert data["current_pass"] == 1
        assert data["is_complete"] is False
        assert "id" in data

    async def test_list_tasks(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson9/tasks", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["current_pass_label"] == "70%"

    async def test_get_task(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson9/tasks/{task_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == task_id

    async def test_update_task(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson9/tasks/{task_id}",
            json={"task_name": "Updated Task Name"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["task_name"] == "Updated Task Name"

    async def test_delete_task(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson9/tasks/{task_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson9/tasks/{task_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_task_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson9/tasks/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestPassRecording:
    async def test_record_pass_1(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        resp = await client.post(
            f"/lesson9/tasks/{task_id}/passes",
            json={
                "key_question_answer": "Yes, right problem and approach",
                "feedback": "Structure looks good, change the error format to JSON",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_pass"] == 2
        assert len(data["passes"]) == 1
        assert data["is_complete"] is False

    async def test_record_all_three_passes(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        # Pass 1
        await client.post(
            f"/lesson9/tasks/{task_id}/passes",
            json={"key_question_answer": "Yes", "feedback": "Looks good"},
            headers=auth_headers(token),
        )
        # Pass 2
        await client.post(
            f"/lesson9/tasks/{task_id}/passes",
            json={"key_question_answer": "Edge cases handled", "feedback": "Add retry logic"},
            headers=auth_headers(token),
        )
        # Pass 3
        resp = await client.post(
            f"/lesson9/tasks/{task_id}/passes",
            json={"key_question_answer": "Ready for production", "feedback": "Add docstrings"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_complete"] is True
        assert len(data["passes"]) == 3

    async def test_record_pass_on_complete_task(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson9/tasks",
            json=TASK_PAYLOAD,
            headers=auth_headers(token),
        )
        task_id = create_resp.json()["id"]

        for _ in range(3):
            await client.post(
                f"/lesson9/tasks/{task_id}/passes",
                json={"key_question_answer": "Yes", "feedback": "Good"},
                headers=auth_headers(token),
            )

        resp = await client.post(
            f"/lesson9/tasks/{task_id}/passes",
            json={"key_question_answer": "Extra", "feedback": "Should fail"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 400


class TestIterationStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson9/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_tasks"] == 0
        assert data["completed_tasks"] == 0


class TestIterationReference:
    async def test_get_pass_info(self, client):
        resp = await client.get("/lesson9/pass-info")
        assert resp.status_code == 200
        data = resp.json()
        assert "1" in data or 1 in data

    async def test_get_transition_templates(self, client):
        resp = await client.get("/lesson9/transition-templates")
        assert resp.status_code == 200
