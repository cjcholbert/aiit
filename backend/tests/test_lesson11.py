"""Tests for Lesson 11: Frontier Mapper endpoints."""
import pytest

from backend.tests.conftest import auth_headers


ZONE_PAYLOAD = {
    "name": "Python Scripting",
    "category": "coding",
    "reliability": "reliable",
    "confidence": 85,
    "strengths": ["Standard library", "Common patterns"],
    "weaknesses": ["Complex async", "Performance optimization"],
    "verification_needs": "Test execution, edge cases",
}

ENCOUNTER_PAYLOAD = {
    "encounter_type": "success",
    "task_description": "Generate a Python script to parse CSV files",
    "outcome": "Working script on first try",
    "expected_result": "Expected 1-2 iterations",
    "lessons": "AI excels at straightforward data processing",
    "tags": ["python", "csv"],
}


class TestZoneCRUD:
    async def test_create_zone(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Python Scripting"
        assert data["reliability"] == "reliable"
        assert data["confidence"] == 85
        assert "id" in data

    async def test_list_zones(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson11/zones", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Python Scripting"

    async def test_get_zone(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        zone_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson11/zones/{zone_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == zone_id

    async def test_update_zone(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        zone_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson11/zones/{zone_id}",
            json={"name": "Updated Zone", "reliability": "mixed"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Zone"
        assert resp.json()["reliability"] == "mixed"

    async def test_delete_zone(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        zone_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson11/zones/{zone_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        resp = await client.get(
            f"/lesson11/zones/{zone_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_zone_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson11/zones/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestEncounterCRUD:
    async def test_create_encounter(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson11/encounters",
            json=ENCOUNTER_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["encounter_type"] == "success"
        assert "id" in data

    async def test_create_encounter_with_zone(self, client, test_user):
        _, token = test_user
        zone_resp = await client.post(
            "/lesson11/zones",
            json=ZONE_PAYLOAD,
            headers=auth_headers(token),
        )
        zone_id = zone_resp.json()["id"]

        payload = {**ENCOUNTER_PAYLOAD, "zone_id": zone_id}
        resp = await client.post(
            "/lesson11/encounters",
            json=payload,
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["zone_id"] == zone_id
        assert resp.json()["zone_name"] == "Python Scripting"

    async def test_list_encounters(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson11/encounters",
            json=ENCOUNTER_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson11/encounters", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_encounter(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/encounters",
            json=ENCOUNTER_PAYLOAD,
            headers=auth_headers(token),
        )
        enc_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson11/encounters/{enc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == enc_id

    async def test_update_encounter(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/encounters",
            json=ENCOUNTER_PAYLOAD,
            headers=auth_headers(token),
        )
        enc_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson11/encounters/{enc_id}",
            json={"outcome": "Updated outcome", "encounter_type": "failure"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["outcome"] == "Updated outcome"
        assert resp.json()["encounter_type"] == "failure"

    async def test_delete_encounter(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson11/encounters",
            json=ENCOUNTER_PAYLOAD,
            headers=auth_headers(token),
        )
        enc_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson11/encounters/{enc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        resp = await client.get(
            f"/lesson11/encounters/{enc_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_encounter_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson11/encounters/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestFrontierStats:
    async def test_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson11/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_zones"] == 0
        assert data["total_encounters"] == 0


class TestFrontierReference:
    async def test_get_reliability_levels(self, client):
        resp = await client.get("/lesson11/reliability-levels")
        assert resp.status_code == 200

    async def test_get_categories(self, client):
        resp = await client.get("/lesson11/categories")
        assert resp.status_code == 200

    async def test_get_encounter_types(self, client):
        resp = await client.get("/lesson11/encounter-types")
        assert resp.status_code == 200
