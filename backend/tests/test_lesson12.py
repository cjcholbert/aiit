"""Tests for Lesson 12: Reference Card endpoints."""
import pytest

from backend.tests.conftest import auth_headers


CARD_PAYLOAD = {
    "name": "My AI Reference Card",
    "personal_rules": ["Always verify calculations", "Never trust AI for dates"],
    "quick_prompts": [{"trigger": "review", "prompt": "Review this code..."}],
    "custom_sections": [{"title": "Notes", "content": "Custom section", "order": 1}],
}


class TestCardCRUD:
    async def test_create_card(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My AI Reference Card"
        assert data["is_primary"] is True  # first card becomes primary
        assert "id" in data

    async def test_list_cards(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson12/cards", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "My AI Reference Card"

    async def test_get_card(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson12/cards/{card_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == card_id

    async def test_get_primary_card(self, client, test_user):
        _, token = test_user
        # Should auto-create a default primary card if none exists
        resp = await client.get(
            "/lesson12/cards/primary",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["is_primary"] is True

    async def test_update_card(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson12/cards/{card_id}",
            json={"name": "Updated Card"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Card"

    async def test_delete_non_primary_card(self, client, test_user):
        _, token = test_user
        # Create primary card first
        await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        # Create second card (non-primary)
        second_resp = await client.post(
            "/lesson12/cards",
            json={"name": "Secondary Card"},
            headers=auth_headers(token),
        )
        second_id = second_resp.json()["id"]
        assert second_resp.json()["is_primary"] is False

        resp = await client.delete(
            f"/lesson12/cards/{second_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        resp = await client.get(
            f"/lesson12/cards/{second_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_delete_primary_card_fails(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson12/cards/{card_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 400

    async def test_card_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson12/cards/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestCardGenerate:
    async def test_generate_card_content(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.post(
            f"/lesson12/cards/{card_id}/generate",
            json={
                "include_templates": True,
                "include_trust": True,
                "include_verification": False,
                "include_delegation": False,
                "include_iteration": False,
                "include_feedback": False,
                "include_workflows": False,
                "include_context": False,
                "include_frontier": False,
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == card_id
        assert data["last_generated"] is not None


class TestCardExport:
    async def test_export_json(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.post(
            f"/lesson12/cards/{card_id}/export",
            json={"format": "json"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "My AI Reference Card"

    async def test_export_markdown(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson12/cards",
            json=CARD_PAYLOAD,
            headers=auth_headers(token),
        )
        card_id = create_resp.json()["id"]

        resp = await client.post(
            f"/lesson12/cards/{card_id}/export",
            json={"format": "markdown"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert "My AI Reference Card" in resp.text


class TestReferenceStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson12/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_cards"] == 0
        assert data["has_primary_card"] is False


class TestReferenceData:
    async def test_get_sections(self, client):
        resp = await client.get("/lesson12/sections")
        assert resp.status_code == 200

    async def test_get_export_formats(self, client):
        resp = await client.get("/lesson12/export-formats")
        assert resp.status_code == 200

    async def test_get_example(self, client):
        resp = await client.get("/lesson12/example")
        assert resp.status_code == 200
