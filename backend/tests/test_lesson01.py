"""Tests for Lesson 1: Context Tracker endpoints."""
import pytest

from backend.tests.conftest import auth_headers
from backend.modules.lesson01_context.schemas import (
    Analysis, ContextProvided, ContextAddedLater, AssumptionsWrong,
    Pattern, Coaching, Confidence, ParsedTranscript, Turn,
)

MOCK_ANALYSIS = Analysis(
    topic="Test Conversation Topic",
    context_provided=ContextProvided(
        details="User provided project details",
        what_worked="Good context about project requirements",
    ),
    context_added_later=ContextAddedLater(
        details="None needed",
        triggers="None",
        could_have_been_upfront=False,
    ),
    assumptions_wrong=AssumptionsWrong(
        details="None",
        why_assumed="N/A",
        user_contributed="N/A",
    ),
    pattern=Pattern(
        category="Well-scoped request",
        insight="User provided clear context from the start",
    ),
    coaching=Coaching(
        context_that_would_have_helped="None needed",
        prompt_rewrite="N/A",
        habit_to_build="Continue providing upfront context",
    ),
    confidence=Confidence(score=8, reasoning="Clear conversation"),
)


class TestConversationCRUD:
    async def test_list_conversations_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson1/conversations", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_analyze_creates_conversation(
        self, client, test_user, monkeypatch
    ):
        _, token = test_user

        async def mock_check():
            return True, "Connected", ["claude-3-haiku"]

        def mock_parse(text):
            return ParsedTranscript(turns=[
                Turn(role="user", content="How do I write a Python function?"),
                Turn(role="assistant", content="Here is an example..."),
            ])

        def mock_validate(parsed):
            return True, None

        async def mock_analyze(parsed):
            return MOCK_ANALYSIS

        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.check_api_connection",
            mock_check,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.parse_transcript",
            mock_parse,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.validate_transcript",
            mock_validate,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.analyze_transcript",
            mock_analyze,
        )

        resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "User: Hello\nAssistant: Hi there"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["analysis"]["topic"] == "Test Conversation Topic"
        assert "id" in data

    async def test_get_and_delete_conversation(
        self, client, test_user, monkeypatch
    ):
        _, token = test_user

        async def mock_check():
            return True, "Connected", ["claude-3-haiku"]

        def mock_parse(text):
            return ParsedTranscript(turns=[
                Turn(role="user", content="Hello"),
                Turn(role="assistant", content="Hi"),
            ])

        def mock_validate(parsed):
            return True, None

        async def mock_analyze(parsed):
            return MOCK_ANALYSIS

        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.check_api_connection",
            mock_check,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.parse_transcript",
            mock_parse,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.validate_transcript",
            mock_validate,
        )
        monkeypatch.setattr(
            "backend.modules.lesson01_context.routes.analyze_transcript",
            mock_analyze,
        )

        # Create
        create_resp = await client.post(
            "/lesson1/analyze",
            json={"raw_transcript": "User: Hello\nAssistant: Hi"},
            headers=auth_headers(token),
        )
        conv_id = create_resp.json()["id"]

        # Get
        resp = await client.get(
            f"/lesson1/conversations/{conv_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == conv_id

        # Delete
        resp = await client.delete(
            f"/lesson1/conversations/{conv_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

        # Verify gone
        resp = await client.get(
            f"/lesson1/conversations/{conv_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_pattern_stats_empty(self, client, test_user):
        _, token = test_user
        resp = await client.get(
            "/lesson1/patterns", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_conversations"] == 0
