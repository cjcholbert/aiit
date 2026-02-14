"""Tests for Lesson 3: Template Builder endpoints."""
import pytest

from backend.tests.conftest import auth_headers


TEMPLATE_PAYLOAD = {
    "name": "Code Review Template",
    "category": "technical",
    "description": "Template for requesting code reviews",
    "content": "Review this {{language}} code for {{focus_area}}. The code is part of a {{project_type}} project.",
    "variables": [
        {"name": "language", "description": "Programming language", "default": "Python", "required": True},
        {"name": "focus_area", "description": "What to focus on", "default": "bugs", "required": False},
        {"name": "project_type", "description": "Type of project", "default": "", "required": False},
    ],
    "tags": ["code", "review"],
}


class TestTemplateCRUD:
    async def test_create_template(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Code Review Template"
        assert data["category"] == "technical"
        assert len(data["variables"]) == 3
        assert data["usage_count"] == 0
        assert "id" in data

    async def test_list_templates(self, client, test_user):
        _, token = test_user
        # Create two templates
        await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        second = dict(TEMPLATE_PAYLOAD, name="Second Template", category="general")
        await client.post(
            "/lesson3/templates",
            json=second,
            headers=auth_headers(token),
        )

        resp = await client.get(
            "/lesson3/templates", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    async def test_get_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        template_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson3/templates/{template_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == template_id
        assert resp.json()["content"] == TEMPLATE_PAYLOAD["content"]

    async def test_update_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        template_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson3/templates/{template_id}",
            json={"name": "Updated Name", "is_favorite": True},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"
        assert resp.json()["is_favorite"] is True

    async def test_delete_template(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        template_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson3/templates/{template_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        # Verify gone
        resp = await client.get(
            f"/lesson3/templates/{template_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_template_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson3/templates/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestTemplateAI:
    async def test_template_test_with_mock(
        self, client, test_user, monkeypatch
    ):
        _, token = test_user

        # Create template first
        create_resp = await client.post(
            "/lesson3/templates",
            json=TEMPLATE_PAYLOAD,
            headers=auth_headers(token),
        )
        template_id = create_resp.json()["id"]

        # Mock the AI call
        async def mock_test_ai(rendered_prompt):
            return "This is a mocked AI response for the template test."

        monkeypatch.setattr(
            "backend.modules.lesson03_templates.routes.test_template_with_ai",
            mock_test_ai,
        )

        resp = await client.post(
            "/lesson3/templates/test",
            json={
                "template_id": template_id,
                "test_prompt": "Please review this code for quality",
                "variable_values": {"language": "Python", "focus_area": "security"},
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ai_response"] == "This is a mocked AI response for the template test."
        assert data["template_id"] == template_id
