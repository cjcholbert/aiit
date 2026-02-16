"""Tests for Lesson 10: Status Reporter endpoints."""
import pytest

from backend.tests.conftest import auth_headers


TEMPLATE_PAYLOAD = {
    "name": "Weekly Status Report",
    "description": "Generate team status report",
    "frequency": "weekly",
    "estimated_time_minutes": 45,
    "inputs": [
        {"name": "accomplishments", "type": "text", "description": "Key accomplishments", "required": True},
    ],
    "steps": [
        {"order": 1, "description": "Gather accomplishments", "is_ai_step": False},
        {"order": 2, "description": "Generate report", "is_ai_step": True},
    ],
    "prompt_template": "Generate a status report: {{accomplishments}}",
    "quality_checks": ["accuracy", "completeness"],
}

REPORT_PAYLOAD = {
    "title": "Week 5 Status Report",
    "inputs_used": {"accomplishments": "Completed API migration"},
    "generated_content": "# Status Report\n\nCompleted API migration this week.",
    "actual_time_minutes": 15,
    "quality_score": 8,
    "notes": "Good report",
}


class TestWorkflowTemplateCRUD:
    async def test_create_template(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Weekly Status Report"
        assert data["frequency"] == "weekly"
        assert "id" in data

    async def test_list_templates(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson10/templates", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        tmpl_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson10/templates/{tmpl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == tmpl_id

    async def test_update_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        tmpl_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson10/templates/{tmpl_id}",
            json={"name": "Updated Template", "is_active": False},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Template"
        assert resp.json()["is_active"] is False

    async def test_delete_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        tmpl_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson10/templates/{tmpl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson10/templates/{tmpl_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_template_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson10/templates/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestStatusReportCRUD:
    async def test_create_report_without_template(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson10/reports",
            json=REPORT_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Week 5 Status Report"
        assert data["quality_score"] == 8

    async def test_create_report_with_template(self, client, test_user):
        _, token = test_user
        tmpl_resp = await client.post(
            "/lesson10/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        tmpl_id = tmpl_resp.json()["id"]

        payload = {**REPORT_PAYLOAD, "template_id": tmpl_id}
        resp = await client.post(
            "/lesson10/reports",
            json=payload,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        assert resp.json()["template_id"] == tmpl_id
        assert resp.json()["template_name"] == "Weekly Status Report"

    async def test_list_reports(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson10/reports",
            json=REPORT_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson10/reports", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_report(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/reports",
            json=REPORT_PAYLOAD,
            headers=auth_headers(token),
        )
        report_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson10/reports/{report_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == report_id

    async def test_update_report(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/reports",
            json=REPORT_PAYLOAD,
            headers=auth_headers(token),
        )
        report_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson10/reports/{report_id}",
            json={"title": "Updated Report", "quality_score": 9},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Report"
        assert resp.json()["quality_score"] == 9

    async def test_delete_report(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson10/reports",
            json=REPORT_PAYLOAD,
            headers=auth_headers(token),
        )
        report_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson10/reports/{report_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

    async def test_report_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson10/reports/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestWorkflowStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson10/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_templates"] == 0
        assert data["total_reports"] == 0
