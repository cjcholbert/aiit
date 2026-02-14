"""Lesson 1: Context Pattern Tracker API routes."""
import logging
from collections import Counter
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from backend.database import get_db
from backend.database.models import User, Conversation, UserProgress
from backend.auth.dependencies import get_current_user

from .schemas import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    ConversationSummary, PatternStats, InsightsResponse, Analysis,
    HabitCount, GapItem, StrengthItem, AuditEntry, Turn, ParsedTranscript
)
from backend.rate_limit import limiter
from .parser import parse_transcript, validate_transcript
from .analyzer import analyze_transcript, normalize_transcript, check_api_connection, AnalyzerError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson1", tags=["Lesson 1: Context Tracker"])


@router.get("/status")
async def get_status():
    """Check API connection status."""
    connected, message, models = await check_api_connection()
    return {
        "connected": connected,
        "message": message,
        "models": models
    }


@router.post("/analyze", response_model=ConversationResponse)
@limiter.limit("3/minute")
async def analyze_conversation(
    request: Request,
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a raw transcript and return the analysis.
    Saves the conversation to the user's history.
    """
    connected, message, _ = await check_api_connection()
    if not connected:
        raise HTTPException(status_code=503, detail=message)

    parsed = parse_transcript(body.raw_transcript)
    is_valid, error_msg = validate_transcript(parsed)

    if not is_valid:
        logger.info("Direct parsing failed, attempting AI normalization...")
        try:
            normalized_text = await normalize_transcript(body.raw_transcript)
            parsed = parse_transcript(normalized_text)
            is_valid, error_msg = validate_transcript(parsed)

            if not is_valid:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not parse conversation even after normalization. {error_msg}"
                )
            logger.info("AI normalization successful")
        except AnalyzerError as e:
            raise HTTPException(status_code=500, detail=f"Normalization failed: {str(e)}")

    try:
        analysis = await analyze_transcript(parsed)
    except AnalyzerError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save to database
    conversation = Conversation(
        user_id=current_user.id,
        raw_transcript=body.raw_transcript,
        analysis=analysis.model_dump()
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    logger.info(f"Analyzed and saved conversation {conversation.id} for user {current_user.email}")

    return ConversationResponse(
        id=conversation.id,
        created_at=conversation.created_at,
        raw_transcript=conversation.raw_transcript,
        analysis=Analysis(**conversation.analysis),
        user_edits=None
    )


@router.post("/upload", response_model=ConversationResponse)
async def upload_conversation(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a JSON file containing a conversation for analysis.
    """
    connected, message, _ = await check_api_connection()
    if not connected:
        raise HTTPException(status_code=503, detail=message)

    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except (UnicodeDecodeError, IOError) as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Handle various formats
    if isinstance(data, dict) and "messages" in data:
        messages = data["messages"]
    elif isinstance(data, dict) and "raw_transcript" in data:
        # Redirect to analyze endpoint logic
        raw_transcript = data["raw_transcript"]
        parsed = parse_transcript(raw_transcript)
        is_valid, error_msg = validate_transcript(parsed)

        if not is_valid:
            try:
                normalized_text = await normalize_transcript(raw_transcript)
                parsed = parse_transcript(normalized_text)
                is_valid, error_msg = validate_transcript(parsed)
                if not is_valid:
                    raise HTTPException(status_code=400, detail=f"Could not parse conversation. {error_msg}")
            except AnalyzerError as e:
                raise HTTPException(status_code=500, detail=f"Normalization failed: {str(e)}")

        try:
            analysis = await analyze_transcript(parsed)
            conversation = Conversation(
                user_id=current_user.id,
                raw_transcript=raw_transcript,
                analysis=analysis.model_dump()
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)

            return ConversationResponse(
                id=conversation.id,
                created_at=conversation.created_at,
                raw_transcript=conversation.raw_transcript,
                analysis=Analysis(**conversation.analysis),
                user_edits=None
            )
        except AnalyzerError as e:
            raise HTTPException(status_code=500, detail=str(e))

    elif isinstance(data, list):
        messages = data
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid format. Expected {messages: [...]} or {raw_transcript: '...'} or [...]"
        )

    if not messages or len(messages) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 messages")

    # Convert to Turn format
    turns = []
    for msg in messages:
        role = msg.get("role", "").lower()
        content = msg.get("content", "")

        if role in ("user", "human", "you"):
            turns.append(Turn(role="user", content=content))
        elif role in ("assistant", "ai", "claude", "chatgpt", "gpt"):
            turns.append(Turn(role="assistant", content=content))

    if len(turns) < 2:
        raise HTTPException(status_code=400, detail="Could not parse user/assistant messages")

    parsed = ParsedTranscript(turns=turns)

    try:
        analysis = await analyze_transcript(parsed)
        raw = "\n\n".join([f"{'User' if t.role == 'user' else 'Assistant'}: {t.content}" for t in turns])

        conversation = Conversation(
            user_id=current_user.id,
            raw_transcript=raw,
            analysis=analysis.model_dump()
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

        return ConversationResponse(
            id=conversation.id,
            created_at=conversation.created_at,
            raw_transcript=conversation.raw_transcript,
            analysis=Analysis(**conversation.analysis),
            user_edits=None
        )
    except AnalyzerError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all conversations for the current user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()

    summaries = []
    for conv in conversations:
        analysis = conv.analysis or {}
        summaries.append(ConversationSummary(
            id=conv.id,
            created_at=conv.created_at,
            topic=analysis.get("topic", "Unknown"),
            pattern_category=analysis.get("pattern", {}).get("category", "Unknown"),
            confidence_score=analysis.get("confidence", {}).get("score", 0)
        ))

    return summaries


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single conversation by ID."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationResponse(
        id=conversation.id,
        created_at=conversation.created_at,
        raw_transcript=conversation.raw_transcript,
        analysis=Analysis(**conversation.analysis),
        user_edits=conversation.user_edits
    )


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a conversation with user edits."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.user_edits = update.user_edits.model_dump()
    await db.commit()
    await db.refresh(conversation)

    logger.info(f"Updated conversation {conversation_id}")

    return ConversationResponse(
        id=conversation.id,
        created_at=conversation.created_at,
        raw_transcript=conversation.raw_transcript,
        analysis=Analysis(**conversation.analysis),
        user_edits=conversation.user_edits
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conversation)
    await db.commit()

    logger.info(f"Deleted conversation {conversation_id}")

    return {"deleted": True, "id": conversation_id}


@router.get("/patterns", response_model=PatternStats)
async def get_pattern_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated pattern statistics for the current user."""
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == current_user.id)
    )
    conversations = result.scalars().all()

    if not conversations:
        return PatternStats(
            total_conversations=0,
            count_by_category={},
            avg_confidence_score=0.0,
            common_habits=[]
        )

    categories = []
    confidence_scores = []
    habits = []

    for conv in conversations:
        analysis = conv.analysis or {}

        pattern = analysis.get("pattern", {})
        if pattern.get("category"):
            categories.append(pattern["category"])

        confidence = analysis.get("confidence", {})
        if confidence.get("score"):
            confidence_scores.append(confidence["score"])

        coaching = analysis.get("coaching", {})
        if coaching.get("habit_to_build"):
            habits.append(coaching["habit_to_build"])

    category_counts = dict(Counter(categories))
    habit_counts = Counter(habits)
    common_habits = [
        HabitCount(habit=habit, count=count)
        for habit, count in habit_counts.most_common(10)
    ]

    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0

    return PatternStats(
        total_conversations=len(conversations),
        count_by_category=category_counts,
        avg_confidence_score=round(avg_confidence, 2),
        common_habits=common_habits
    )


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated insights from all conversations."""
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == current_user.id)
    )
    conversations = result.scalars().all()

    if not conversations:
        return InsightsResponse(
            total_analyzed=0,
            context_gaps=[],
            context_strengths=[],
            audit_summary=[]
        )

    gaps = []
    strengths = []
    audit_entries = []

    for conv in conversations:
        analysis = conv.analysis or {}
        topic = analysis.get("topic", "Unknown")

        coaching = analysis.get("coaching", {})
        if coaching.get("context_that_would_have_helped"):
            gaps.append(coaching["context_that_would_have_helped"])

        context_added = analysis.get("context_added_later", {})
        if context_added.get("details") and context_added["details"] not in ("None", "N/A", "None needed"):
            gaps.append(context_added["details"])

        context_provided = analysis.get("context_provided", {})
        if context_provided.get("what_worked") and context_provided["what_worked"] not in ("Minimal context provided",):
            strengths.append(context_provided["what_worked"])

        pattern = analysis.get("pattern", {})
        audit_entries.append(AuditEntry(
            id=conv.id,
            topic=topic,
            pattern=pattern.get("category", "Unknown"),
            gap=coaching.get("context_that_would_have_helped", ""),
            strength=context_provided.get("what_worked", ""),
            created_at=conv.created_at
        ))

    gap_counts = Counter(gaps)
    strength_counts = Counter(strengths)

    top_gaps = [
        GapItem(
            gap=gap,
            count=count,
            percentage=round(count / len(conversations) * 100)
        )
        for gap, count in gap_counts.most_common(3)
    ]

    top_strengths = [
        StrengthItem(
            strength=strength,
            count=count,
            percentage=round(count / len(conversations) * 100)
        )
        for strength, count in strength_counts.most_common(3)
    ]

    audit_entries.sort(key=lambda x: x.created_at or "", reverse=True)

    return InsightsResponse(
        total_analyzed=len(conversations),
        context_gaps=top_gaps,
        context_strengths=top_strengths,
        audit_summary=audit_entries[:10]
    )
