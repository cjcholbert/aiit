"""Tests for error paths: 404s, ownership isolation, validation, API failures."""
import pytest

from backend.tests.conftest import auth_headers
from backend.auth.jwt import create_access_token, get_password_hash
from backend.database.models import User


# ---------------------------------------------------------------------------
# Helper fixture: a second user for ownership-isolation tests
# ---------------------------------------------------------------------------

@pytest.fixture
async def second_user(db_session) -> tuple[User, str]:
    """Create a second test user distinct from test_user."""
    user = User(
        email="seconduser@example.com",
        password_hash=get_password_hash("secondpassword123"),
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id)
    return user, token


# ===================================================================
# 1. Ownership isolation tests
# ===================================================================

class TestOwnershipIsolation:
    """User A cannot access, update, or delete user B's resources."""

    async def test_lesson1_conversation_isolation(
        self, client, test_user, second_user, monkeypatch
    ):
        user_a, token_a = test_user
        _, token_b = second_user

        # Patch AI calls for lesson1 analyze
        from backend.modules.lesson01_context.schemas import (
            Analysis, ContextProvided, ContextAddedLater, AssumptionsWrong,
            Pattern, Coaching, Confidence, ParsedTranscript, Turn,
        )

        mock_analysis = Analysis(
            topic="Test", context_provided=ContextProvided(details="d", what_worked="w"),
            context_added_later=ContextAddedLater(details="d", triggers="t", could_have_been_upfront=False),
            assumptions_wrong=AssumptionsWrong(details="d", why_assumed="w", user_contributed="u"),
            pattern=Pattern(category="c", insight="i"),
            coaching=Coaching(context_that_would_have_helped="c", prompt_rewrite="p", habit_to_build="h"),
            confidence=Confidence(score=7, reasoning="r"),
        )

        async def mock_check():
            return True, "ok", ["claude-3-haiku"]

        def mock_parse(text):
            return ParsedTranscript(turns=[
                Turn(role="user", content="Hi"),
                Turn(role="assistant", content="Hello"),
            ])

        def mock_validate(parsed):
            return True, None

        async def mock_analyze(parsed):
            return mock_analysis

        monkeypatch.setattr("backend.modules.lesson01_context.routes.check_api_connection", mock_check)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.parse_transcript", mock_parse)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.validate_transcript", mock_validate)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.analyze_transcript", mock_analyze)

        # User A creates a conversation
        resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "User: Hi\nAssistant: Hello"},
            headers=auth_headers(token_a),
        )
        assert resp.status_code == 200
        conv_id = resp.json()["id"]

        # User B cannot GET it
        resp = await client.get(
            f"/lesson1/conversations/{conv_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B cannot DELETE it
        resp = await client.delete(
            f"/lesson1/conversations/{conv_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B list is empty
        resp = await client.get(
            "/lesson1/conversations",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_lesson3_template_isolation(self, client, test_user, second_user):
        _, token_a = test_user
        _, token_b = second_user

        # User A creates template
        resp = await client.post(
            "/lesson3/templates",
            json={
                "name": "Private Template",
                "category": "technical",
                "content": "Review {{code}}",
                "variables": [{"name": "code", "description": "Code to review", "required": True}],
            },
            headers=auth_headers(token_a),
        )
        assert resp.status_code == 201
        tmpl_id = resp.json()["id"]

        # User B cannot GET it
        resp = await client.get(
            f"/lesson3/templates/{tmpl_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B cannot UPDATE it
        resp = await client.put(
            f"/lesson3/templates/{tmpl_id}",
            json={"name": "Hacked Template"},
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B cannot DELETE it
        resp = await client.delete(
            f"/lesson3/templates/{tmpl_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

    async def test_lesson5_prediction_isolation(self, client, test_user, second_user):
        _, token_a = test_user
        _, token_b = second_user

        # User A creates prediction
        resp = await client.post(
            "/lesson5/predictions",
            json={
                "output_description": "Private prediction",
                "confidence_rating": 7,
            },
            headers=auth_headers(token_a),
        )
        assert resp.status_code == 201
        pred_id = resp.json()["id"]

        # User B cannot GET it
        resp = await client.get(
            f"/lesson5/predictions/{pred_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B cannot VERIFY it
        resp = await client.put(
            f"/lesson5/predictions/{pred_id}/verify",
            json={"was_correct": True},
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

    async def test_lesson7_decomposition_isolation(self, client, test_user, second_user):
        _, token_a = test_user
        _, token_b = second_user

        # User A creates decomposition
        resp = await client.post(
            "/lesson7/decompositions",
            json={
                "project_name": "Secret Project",
                "tasks": [
                    {"title": "Task 1", "description": "Desc", "category": "ai_optimal"},
                ],
            },
            headers=auth_headers(token_a),
        )
        assert resp.status_code == 201
        decomp_id = resp.json()["id"]

        # User B cannot GET it
        resp = await client.get(
            f"/lesson7/decompositions/{decomp_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404

        # User B cannot DELETE it
        resp = await client.delete(
            f"/lesson7/decompositions/{decomp_id}",
            headers=auth_headers(token_b),
        )
        assert resp.status_code == 404


# ===================================================================
# 2. Validation error tests
# ===================================================================

class TestValidationErrors:
    """Pydantic validation errors return 422."""

    async def test_register_invalid_email(self, client):
        resp = await client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "securepass123",
        })
        assert resp.status_code == 422

    async def test_register_missing_password(self, client):
        resp = await client.post("/auth/register", json={
            "email": "valid@example.com",
        })
        assert resp.status_code == 422

    async def test_lesson5_prediction_missing_required(self, client, test_user):
        _, token = test_user
        # Missing confidence_rating (required)
        resp = await client.post(
            "/lesson5/predictions",
            json={"output_description": "Something"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422

    async def test_lesson7_decomposition_missing_project_name(self, client, test_user):
        _, token = test_user
        # Missing project_name (required)
        resp = await client.post(
            "/lesson7/decompositions",
            json={"tasks": []},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422

    async def test_lesson11_zone_empty_name(self, client, test_user):
        _, token = test_user
        # Empty name violates min_length=1
        resp = await client.post(
            "/lesson11/zones",
            json={"name": ""},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422


# ===================================================================
# 3. Auth edge case tests
# ===================================================================

class TestAuthEdgeCases:
    """Auth-related edge cases."""

    async def test_expired_token(self, client):
        """Manually crafted expired token should be rejected."""
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MH0.invalid"},
        )
        assert resp.status_code == 401

    async def test_malformed_token(self, client):
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer totally-not-a-jwt"},
        )
        assert resp.status_code == 401

    async def test_no_bearer_prefix(self, client):
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": "Token some-value"},
        )
        assert resp.status_code == 403

    async def test_protected_route_no_auth(self, client):
        resp = await client.get("/lesson3/templates")
        assert resp.status_code == 403

    async def test_login_empty_body(self, client):
        resp = await client.post("/auth/login", json={})
        assert resp.status_code == 422


# ===================================================================
# 4. API failure mocking tests
# ===================================================================

class TestAPIFailures:
    """Mocked Anthropic API failures should return appropriate errors."""

    async def test_lesson1_api_disconnected(self, client, test_user, monkeypatch):
        _, token = test_user

        async def mock_check():
            return False, "API key not set", []

        def mock_parse(text):
            from backend.modules.lesson01_context.schemas import ParsedTranscript, Turn
            return ParsedTranscript(turns=[
                Turn(role="user", content="Hi"),
                Turn(role="assistant", content="Hello"),
            ])

        def mock_validate(parsed):
            return True, None

        monkeypatch.setattr("backend.modules.lesson01_context.routes.check_api_connection", mock_check)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.parse_transcript", mock_parse)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.validate_transcript", mock_validate)

        resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "User: Hi\nAssistant: Hello"},
            headers=auth_headers(token),
        )
        # Should fail with 503 (service unavailable) or similar error
        assert resp.status_code in (500, 503)

    async def test_lesson1_analyzer_error(self, client, test_user, monkeypatch):
        _, token = test_user

        from backend.modules.lesson01_context.analyzer import AnalyzerError
        from backend.modules.lesson01_context.schemas import ParsedTranscript, Turn

        async def mock_check():
            return True, "ok", ["claude-3-haiku"]

        def mock_parse(text):
            return ParsedTranscript(turns=[
                Turn(role="user", content="Hi"),
                Turn(role="assistant", content="Hello"),
            ])

        def mock_validate(parsed):
            return True, None

        async def mock_analyze(parsed):
            raise AnalyzerError("Anthropic API rate limited")

        monkeypatch.setattr("backend.modules.lesson01_context.routes.check_api_connection", mock_check)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.parse_transcript", mock_parse)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.validate_transcript", mock_validate)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.analyze_transcript", mock_analyze)

        resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "User: Hi\nAssistant: Hello"},
            headers=auth_headers(token),
        )
        assert resp.status_code in (500, 502, 503)

    async def test_lesson1_invalid_transcript(self, client, test_user, monkeypatch):
        _, token = test_user

        async def mock_check():
            return True, "ok", ["claude-3-haiku"]

        def mock_parse(text):
            from backend.modules.lesson01_context.schemas import ParsedTranscript
            return ParsedTranscript(turns=[])

        def mock_validate(parsed):
            return False, "No valid turns found"

        async def mock_normalize(text):
            return text  # Return unchanged so re-parse still fails

        monkeypatch.setattr("backend.modules.lesson01_context.routes.check_api_connection", mock_check)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.parse_transcript", mock_parse)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.validate_transcript", mock_validate)
        monkeypatch.setattr("backend.modules.lesson01_context.routes.normalize_transcript", mock_normalize)

        resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "garbage text"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 400
