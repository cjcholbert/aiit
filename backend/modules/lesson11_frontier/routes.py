"""Lesson 11: Frontier Mapper - API routes."""
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.rate_limit import limiter
from backend.database.models import User, FrontierZone, FrontierEncounter
from backend.auth import get_current_user

from .schemas import (
    RELIABILITY_LEVELS, ZONE_CATEGORIES, ENCOUNTER_TYPES,
    EXAMPLE_ZONES, EXAMPLE_ENCOUNTERS,
    ZoneCreate, ZoneUpdate, ZoneSummary, ZoneResponse,
    EncounterCreate, EncounterUpdate, EncounterSummary, EncounterResponse,
    FrontierStats
)
from .examples import (
    EXAMPLE_CATEGORIES,
    EXAMPLE_ZONES as CATEGORY_ZONES,
    EXAMPLE_ENCOUNTERS as CATEGORY_ENCOUNTERS
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lesson11", tags=["Lesson 11: Frontier Mapper"])


# =============================================================================
# Reference Data Endpoints
# =============================================================================

@router.get("/reliability-levels")
async def get_reliability_levels():
    """Get available reliability levels."""
    return RELIABILITY_LEVELS


@router.get("/categories")
async def get_categories():
    """Get available zone categories."""
    return ZONE_CATEGORIES


@router.get("/encounter-types")
async def get_encounter_types():
    """Get available encounter types."""
    return ENCOUNTER_TYPES


@router.get("/examples")
async def get_category_examples():
    """Get example zones and encounters organized by category."""
    return {
        "categories": EXAMPLE_CATEGORIES,
        "zones": CATEGORY_ZONES,
        "encounters": CATEGORY_ENCOUNTERS
    }


@router.get("/examples/zones")
async def get_example_zones():
    """Get example zones for inspiration."""
    return CATEGORY_ZONES


@router.get("/examples/encounters")
async def get_example_encounters():
    """Get example encounters for inspiration."""
    return CATEGORY_ENCOUNTERS


# =============================================================================
# Zone CRUD Endpoints
# =============================================================================

@router.post("/zones", response_model=ZoneResponse)
async def create_zone(
    zone: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new frontier zone."""
    db_zone = FrontierZone(
        user_id=current_user.id,
        name=zone.name,
        category=zone.category,
        reliability=zone.reliability,
        confidence=zone.confidence,
        strengths=zone.strengths,
        weaknesses=zone.weaknesses,
        verification_needs=zone.verification_needs,
        notes=zone.notes
    )
    db.add(db_zone)
    await db.commit()
    await db.refresh(db_zone)

    logger.info("Created frontier zone '%s' for user %s", zone.name, current_user.email)

    return ZoneResponse(
        id=db_zone.id,
        name=db_zone.name,
        category=db_zone.category,
        reliability=db_zone.reliability,
        confidence=db_zone.confidence,
        strengths=db_zone.strengths or [],
        weaknesses=db_zone.weaknesses or [],
        verification_needs=db_zone.verification_needs,
        notes=db_zone.notes,
        encounter_count=0,
        recent_encounters=[],
        created_at=db_zone.created_at,
        updated_at=db_zone.updated_at
    )


@router.get("/zones", response_model=list[ZoneSummary])
async def list_zones(
    category: Optional[str] = None,
    reliability: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all frontier zones for the current user."""
    query = select(FrontierZone).where(
        FrontierZone.user_id == current_user.id
    ).options(selectinload(FrontierZone.encounters))

    if category:
        query = query.where(FrontierZone.category == category)
    if reliability:
        query = query.where(FrontierZone.reliability == reliability)

    query = query.order_by(desc(FrontierZone.updated_at))

    result = await db.execute(query)
    zones = result.scalars().all()

    logger.info("Listed %s frontier zones for user %s", len(zones), current_user.email)

    return [
        ZoneSummary(
            id=z.id,
            name=z.name,
            category=z.category,
            reliability=z.reliability,
            confidence=z.confidence,
            strength_count=len(z.strengths or []),
            weakness_count=len(z.weaknesses or []),
            encounter_count=len(z.encounters) if z.encounters else 0,
            created_at=z.created_at,
            updated_at=z.updated_at
        )
        for z in zones
    ]


@router.get("/zones/{zone_id}", response_model=ZoneResponse)
async def get_zone(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single frontier zone by ID."""
    query = select(FrontierZone).where(
        FrontierZone.id == zone_id,
        FrontierZone.user_id == current_user.id
    ).options(selectinload(FrontierZone.encounters))

    result = await db.execute(query)
    zone = result.scalar_one_or_none()

    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Get recent encounters
    recent = sorted(
        zone.encounters or [],
        key=lambda e: e.created_at,
        reverse=True
    )[:5]

    return ZoneResponse(
        id=zone.id,
        name=zone.name,
        category=zone.category,
        reliability=zone.reliability,
        confidence=zone.confidence,
        strengths=zone.strengths or [],
        weaknesses=zone.weaknesses or [],
        verification_needs=zone.verification_needs,
        notes=zone.notes,
        encounter_count=len(zone.encounters) if zone.encounters else 0,
        recent_encounters=[
            {
                "id": e.id,
                "encounter_type": e.encounter_type,
                "task_description": e.task_description[:100] + "..." if len(e.task_description) > 100 else e.task_description,
                "created_at": e.created_at.isoformat()
            }
            for e in recent
        ],
        created_at=zone.created_at,
        updated_at=zone.updated_at
    )


@router.put("/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: str,
    zone_update: ZoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a frontier zone."""
    query = select(FrontierZone).where(
        FrontierZone.id == zone_id,
        FrontierZone.user_id == current_user.id
    ).options(selectinload(FrontierZone.encounters))

    result = await db.execute(query)
    zone = result.scalar_one_or_none()

    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Update fields
    update_data = zone_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)

    await db.commit()
    await db.refresh(zone)

    logger.info("Updated frontier zone %s", zone_id)

    return ZoneResponse(
        id=zone.id,
        name=zone.name,
        category=zone.category,
        reliability=zone.reliability,
        confidence=zone.confidence,
        strengths=zone.strengths or [],
        weaknesses=zone.weaknesses or [],
        verification_needs=zone.verification_needs,
        notes=zone.notes,
        encounter_count=len(zone.encounters) if zone.encounters else 0,
        recent_encounters=[],
        created_at=zone.created_at,
        updated_at=zone.updated_at
    )


@router.delete("/zones/{zone_id}")
async def delete_zone(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a frontier zone."""
    query = select(FrontierZone).where(
        FrontierZone.id == zone_id,
        FrontierZone.user_id == current_user.id
    )

    result = await db.execute(query)
    zone = result.scalar_one_or_none()

    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    await db.delete(zone)
    await db.commit()

    logger.info("Deleted frontier zone %s", zone_id)

    return {"message": "Zone deleted successfully"}


@router.post("/zones/seed-examples")
async def seed_example_zones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed example zones for the current user."""
    zones_created = []

    for example in EXAMPLE_ZONES:
        db_zone = FrontierZone(
            user_id=current_user.id,
            name=example["name"],
            category=example["category"],
            reliability=example["reliability"],
            confidence=example["confidence"],
            strengths=example["strengths"],
            weaknesses=example["weaknesses"],
            verification_needs=example["verification_needs"]
        )
        db.add(db_zone)
        zones_created.append(example["name"])

    await db.commit()

    logger.info("Seeded %s example zones for user %s", len(zones_created), current_user.email)

    return {"message": f"Created {len(zones_created)} example zones", "zones": zones_created}


# =============================================================================
# Encounter CRUD Endpoints
# =============================================================================

@router.post("/encounters", response_model=EncounterResponse)
async def create_encounter(
    encounter: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a new frontier encounter."""
    # Verify zone exists if provided
    zone_name = None
    if encounter.zone_id:
        zone_query = select(FrontierZone).where(
            FrontierZone.id == encounter.zone_id,
            FrontierZone.user_id == current_user.id
        )
        result = await db.execute(zone_query)
        zone = result.scalar_one_or_none()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        zone_name = zone.name

    db_encounter = FrontierEncounter(
        user_id=current_user.id,
        zone_id=encounter.zone_id,
        encounter_type=encounter.encounter_type,
        task_description=encounter.task_description,
        outcome=encounter.outcome,
        expected_result=encounter.expected_result,
        lessons=encounter.lessons,
        tags=encounter.tags
    )
    db.add(db_encounter)
    await db.commit()
    await db.refresh(db_encounter)

    logger.info("Created %s encounter for user %s", encounter.encounter_type, current_user.email)

    return EncounterResponse(
        id=db_encounter.id,
        zone_id=db_encounter.zone_id,
        zone_name=zone_name,
        encounter_type=db_encounter.encounter_type,
        task_description=db_encounter.task_description,
        outcome=db_encounter.outcome,
        expected_result=db_encounter.expected_result,
        lessons=db_encounter.lessons,
        tags=db_encounter.tags or [],
        created_at=db_encounter.created_at
    )


@router.get("/encounters", response_model=list[EncounterSummary])
async def list_encounters(
    zone_id: Optional[str] = None,
    encounter_type: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List encounters with optional filters."""
    query = select(FrontierEncounter).where(
        FrontierEncounter.user_id == current_user.id
    ).options(selectinload(FrontierEncounter.zone))

    if zone_id:
        query = query.where(FrontierEncounter.zone_id == zone_id)
    if encounter_type:
        query = query.where(FrontierEncounter.encounter_type == encounter_type)

    query = query.order_by(desc(FrontierEncounter.created_at)).limit(limit)

    result = await db.execute(query)
    encounters = result.scalars().all()

    # Filter by tag if provided (JSON array search)
    if tag:
        encounters = [e for e in encounters if tag in (e.tags or [])]

    return [
        EncounterSummary(
            id=e.id,
            zone_id=e.zone_id,
            zone_name=e.zone.name if e.zone else None,
            encounter_type=e.encounter_type,
            task_description=e.task_description[:100] + "..." if len(e.task_description) > 100 else e.task_description,
            tags=e.tags or [],
            created_at=e.created_at
        )
        for e in encounters
    ]


@router.get("/encounters/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single encounter by ID."""
    query = select(FrontierEncounter).where(
        FrontierEncounter.id == encounter_id,
        FrontierEncounter.user_id == current_user.id
    ).options(selectinload(FrontierEncounter.zone))

    result = await db.execute(query)
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    return EncounterResponse(
        id=encounter.id,
        zone_id=encounter.zone_id,
        zone_name=encounter.zone.name if encounter.zone else None,
        encounter_type=encounter.encounter_type,
        task_description=encounter.task_description,
        outcome=encounter.outcome,
        expected_result=encounter.expected_result,
        lessons=encounter.lessons,
        tags=encounter.tags or [],
        created_at=encounter.created_at
    )


@router.put("/encounters/{encounter_id}", response_model=EncounterResponse)
async def update_encounter(
    encounter_id: str,
    encounter_update: EncounterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an encounter."""
    query = select(FrontierEncounter).where(
        FrontierEncounter.id == encounter_id,
        FrontierEncounter.user_id == current_user.id
    ).options(selectinload(FrontierEncounter.zone))

    result = await db.execute(query)
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    # Update fields
    update_data = encounter_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(encounter, field, value)

    await db.commit()
    await db.refresh(encounter)

    return EncounterResponse(
        id=encounter.id,
        zone_id=encounter.zone_id,
        zone_name=encounter.zone.name if encounter.zone else None,
        encounter_type=encounter.encounter_type,
        task_description=encounter.task_description,
        outcome=encounter.outcome,
        expected_result=encounter.expected_result,
        lessons=encounter.lessons,
        tags=encounter.tags or [],
        created_at=encounter.created_at
    )


@router.delete("/encounters/{encounter_id}")
async def delete_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an encounter."""
    query = select(FrontierEncounter).where(
        FrontierEncounter.id == encounter_id,
        FrontierEncounter.user_id == current_user.id
    )

    result = await db.execute(query)
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    await db.delete(encounter)
    await db.commit()

    logger.info("Deleted encounter %s", encounter_id)

    return {"message": "Encounter deleted successfully"}


@router.post("/encounters/seed-examples")
async def seed_example_encounters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed example encounters for the current user."""
    encounters_created = []

    for example in EXAMPLE_ENCOUNTERS:
        db_encounter = FrontierEncounter(
            user_id=current_user.id,
            zone_id=None,  # Not linked to specific zone
            encounter_type=example["encounter_type"],
            task_description=example["task_description"],
            outcome=example["outcome"],
            expected_result=example["expected_result"],
            lessons=example["lessons"],
            tags=example["tags"]
        )
        db.add(db_encounter)
        encounters_created.append(example["encounter_type"])

    await db.commit()

    return {"message": f"Created {len(encounters_created)} example encounters"}


# =============================================================================
# AI Pattern Analysis
# =============================================================================

@router.post("/encounters/analyze")
@limiter.limit("3/minute")
async def analyze_encounter_patterns(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze frontier encounter patterns using AI.

    Clusters failures by task type, identifies capability boundaries,
    suggests areas worth exploring, and compares evidence against zone ratings.
    Requires at least 3 encounters.
    """
    from .analyzer import analyze_frontier_patterns, AnalyzerError

    # Get all encounters with zone info
    enc_query = select(FrontierEncounter).where(
        FrontierEncounter.user_id == current_user.id
    ).options(selectinload(FrontierEncounter.zone)).order_by(
        desc(FrontierEncounter.created_at)
    )
    enc_result = await db.execute(enc_query)
    encounters = enc_result.scalars().all()

    if len(encounters) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 3 encounters for pattern analysis. You have {len(encounters)}."
        )

    # Get all zones
    zone_query = select(FrontierZone).where(
        FrontierZone.user_id == current_user.id
    )
    zone_result = await db.execute(zone_query)
    zones = zone_result.scalars().all()

    # Format data for analyzer
    zone_data = [
        {
            "name": z.name,
            "category": z.category,
            "reliability": z.reliability,
            "confidence": z.confidence,
            "strengths": z.strengths or [],
            "weaknesses": z.weaknesses or [],
        }
        for z in zones
    ]

    encounter_data = [
        {
            "encounter_type": e.encounter_type,
            "task_description": e.task_description,
            "outcome": e.outcome,
            "expected_result": e.expected_result,
            "lessons": e.lessons,
            "tags": e.tags or [],
            "zone_name": e.zone.name if e.zone else None,
        }
        for e in encounters
    ]

    try:
        analysis = await analyze_frontier_patterns(
            zones=zone_data,
            encounters=encounter_data,
        )
    except AnalyzerError as e:
        raise HTTPException(status_code=500, detail=str(e))

    logger.info("Analyzed frontier patterns for user %s (%d encounters, %d zones)",
                current_user.email, len(encounters), len(zones))

    return analysis


# =============================================================================
# Statistics Endpoint
# =============================================================================

@router.get("/stats", response_model=FrontierStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get frontier mapping statistics."""
    # Get all zones with encounters
    zones_query = select(FrontierZone).where(
        FrontierZone.user_id == current_user.id
    ).options(selectinload(FrontierZone.encounters))

    zones_result = await db.execute(zones_query)
    zones = zones_result.scalars().all()

    # Get all encounters
    encounters_query = select(FrontierEncounter).where(
        FrontierEncounter.user_id == current_user.id
    )
    encounters_result = await db.execute(encounters_query)
    encounters = encounters_result.scalars().all()

    # Calculate stats
    zones_by_reliability = {"reliable": 0, "mixed": 0, "unreliable": 0}
    zones_by_category = {}
    total_confidence = 0

    for zone in zones:
        zones_by_reliability[zone.reliability] = zones_by_reliability.get(zone.reliability, 0) + 1
        zones_by_category[zone.category] = zones_by_category.get(zone.category, 0) + 1
        total_confidence += zone.confidence

    encounters_by_type = {"success": 0, "failure": 0, "surprise": 0}
    week_ago = datetime.utcnow() - timedelta(days=7)
    encounters_this_week = 0
    all_tags = []
    recent_lessons = []

    for enc in encounters:
        encounters_by_type[enc.encounter_type] = encounters_by_type.get(enc.encounter_type, 0) + 1
        if enc.created_at >= week_ago:
            encounters_this_week += 1
        all_tags.extend(enc.tags or [])
        if enc.lessons:
            recent_lessons.append(enc.lessons)

    # Count tags
    tag_counts = {}
    for tag in all_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1

    common_tags = sorted(
        [{"tag": t, "count": c} for t, c in tag_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    # Most active zones
    most_active = sorted(
        [
            {"name": z.name, "encounter_count": len(z.encounters) if z.encounters else 0}
            for z in zones
        ],
        key=lambda x: x["encounter_count"],
        reverse=True
    )[:5]

    return FrontierStats(
        total_zones=len(zones),
        zones_by_reliability=zones_by_reliability,
        zones_by_category=zones_by_category,
        total_encounters=len(encounters),
        encounters_by_type=encounters_by_type,
        encounters_this_week=encounters_this_week,
        avg_zone_confidence=round(total_confidence / len(zones), 1) if zones else 0,
        most_active_zones=most_active,
        recent_lessons=recent_lessons[-5:][::-1],  # Last 5, most recent first
        common_tags=common_tags
    )
