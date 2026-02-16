"""Tests for Lesson 5: Trust Matrix endpoints."""
import pytest

from backend.tests.conftest import auth_headers


OUTPUT_TYPE_PAYLOAD = {
    "name": "Code Syntax",
    "category": "Code",
    "trust_level": "high",
    "reasoning": "Well-documented languages",
    "verification_approach": "Run linter",
    "examples": ["Python functions", "JS async/await"],
}

PREDICTION_PAYLOAD = {
    "output_description": "AI-generated Python function for data parsing",
    "confidence_rating": 8,
    "uncertainty_notes": "Complex edge cases",
}


class TestOutputTypeCRUD:
    async def test_create_output_type(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Code Syntax"
        assert data["trust_level"] == "high"
        assert "id" in data

    async def test_list_output_types(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson5/output-types", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_output_type(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        ot_id = create_resp.json()["id"]

        resp = await client.get(
            f"/lesson5/output-types/{ot_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == ot_id

    async def test_update_output_type(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        ot_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson5/output-types/{ot_id}",
            json={"name": "Updated Name", "trust_level": "low"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"
        assert resp.json()["trust_level"] == "low"

    async def test_delete_output_type(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        ot_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson5/output-types/{ot_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        resp = await client.get(
            f"/lesson5/output-types/{ot_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_output_type_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson5/output-types/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestPredictionCRUD:
    async def test_create_prediction(self, client, test_user):
        _, token = test_user
        resp = await client.post(
            "/lesson5/predictions",
            json=PREDICTION_PAYLOAD,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["confidence_rating"] == 8
        assert data["was_correct"] is None

    async def test_create_prediction_with_output_type(self, client, test_user):
        _, token = test_user
        ot_resp = await client.post(
            "/lesson5/output-types",
            json=OUTPUT_TYPE_PAYLOAD,
            headers=auth_headers(token),
        )
        ot_id = ot_resp.json()["id"]

        payload = {**PREDICTION_PAYLOAD, "output_type_id": ot_id}
        resp = await client.post(
            "/lesson5/predictions",
            json=payload,
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        assert resp.json()["output_type_id"] == ot_id

    async def test_list_predictions(self, client, test_user):
        _, token = test_user
        await client.post(
            "/lesson5/predictions",
            json=PREDICTION_PAYLOAD,
            headers=auth_headers(token),
        )
        resp = await client.get(
            "/lesson5/predictions", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_verify_prediction(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/predictions",
            json=PREDICTION_PAYLOAD,
            headers=auth_headers(token),
        )
        pred_id = create_resp.json()["id"]

        resp = await client.put(
            f"/lesson5/predictions/{pred_id}/verify",
            json={
                "was_correct": True,
                "actual_issues": "None",
                "verification_method": "Manual test",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["was_correct"] is True
        assert resp.json()["verified_at"] is not None

    async def test_verify_already_verified(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/predictions",
            json=PREDICTION_PAYLOAD,
            headers=auth_headers(token),
        )
        pred_id = create_resp.json()["id"]

        await client.put(
            f"/lesson5/predictions/{pred_id}/verify",
            json={"was_correct": True},
            headers=auth_headers(token),
        )
        resp = await client.put(
            f"/lesson5/predictions/{pred_id}/verify",
            json={"was_correct": False},
            headers=auth_headers(token),
        )
        assert resp.status_code == 400

    async def test_delete_prediction(self, client, test_user):
        _, token = test_user
        create_resp = await client.post(
            "/lesson5/predictions",
            json=PREDICTION_PAYLOAD,
            headers=auth_headers(token),
        )
        pred_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/lesson5/predictions/{pred_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

    async def test_prediction_not_found(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson5/predictions/nonexistent-id",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


class TestCalibrationStats:
    async def test_calibration_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson5/calibration/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_predictions"] == 0
