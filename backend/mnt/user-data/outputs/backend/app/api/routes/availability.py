from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.availability import AvailabilitySchedule, AvailabilityRule, DateOverride
from app.models.event_type import EventType
from app.schemas.availability import (
    AvailabilityScheduleCreate, AvailabilityScheduleUpdate, AvailabilityScheduleOut,
    DateOverrideCreate, DateOverrideOut, AvailableSlot,
)
from app.services.availability_engine import get_available_slots, get_busy_dates
from app.api.routes.users import get_default_user

router = APIRouter(prefix="/availability", tags=["Availability"])


# ── Schedule CRUD ────────────────────────────────────────────────────────────

@router.get("/schedules", response_model=List[AvailabilityScheduleOut])
def list_schedules(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    return (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.user_id == user.id)
        .all()
    )


@router.post("/schedules", response_model=AvailabilityScheduleOut, status_code=201)
def create_schedule(
    payload: AvailabilityScheduleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    """Create a new availability schedule with its rules."""
    # If this is the first schedule or marked default, unset other defaults
    if payload.is_default:
        db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == user.id
        ).update({"is_default": False})

    schedule = AvailabilitySchedule(
        user_id=user.id,
        name=payload.name,
        timezone=payload.timezone,
        is_default=payload.is_default,
    )
    db.add(schedule)
    db.flush()  # get schedule.id before adding rules

    for rule_data in payload.rules:
        rule = AvailabilityRule(schedule_id=schedule.id, **rule_data.model_dump())
        db.add(rule)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/schedules/{schedule_id}", response_model=AvailabilityScheduleOut)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    s = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return s


@router.put("/schedules/{schedule_id}", response_model=AvailabilityScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: AvailabilityScheduleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    """
    Full update of a schedule.
    If rules are included, existing rules are replaced entirely.
    """
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if payload.name is not None:
        schedule.name = payload.name
    if payload.timezone is not None:
        schedule.timezone = payload.timezone
    if payload.is_default is True:
        # Unset all others first
        db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == user.id,
            AvailabilitySchedule.id != schedule_id,
        ).update({"is_default": False})
        schedule.is_default = True

    if payload.rules is not None:
        # Replace all rules
        db.query(AvailabilityRule).filter(AvailabilityRule.schedule_id == schedule_id).delete()
        for rule_data in payload.rules:
            rule = AvailabilityRule(schedule_id=schedule_id, **rule_data.model_dump())
            db.add(rule)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()


# ── Date overrides ────────────────────────────────────────────────────────────

@router.post("/schedules/{schedule_id}/overrides", response_model=DateOverrideOut, status_code=201)
def add_date_override(
    schedule_id: int,
    payload: DateOverrideCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    """Add or update a date override for a schedule."""
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Upsert: if override for this date exists, update it
    existing = (
        db.query(DateOverride)
        .filter(DateOverride.schedule_id == schedule_id, DateOverride.date == payload.date)
        .first()
    )
    if existing:
        for field, value in payload.model_dump().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    override = DateOverride(schedule_id=schedule_id, **payload.model_dump())
    db.add(override)
    db.commit()
    db.refresh(override)
    return override


@router.delete("/schedules/{schedule_id}/overrides/{override_id}", status_code=204)
def delete_date_override(
    schedule_id: int,
    override_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user),
):
    override = (
        db.query(DateOverride)
        .filter(DateOverride.id == override_id, DateOverride.schedule_id == schedule_id)
        .first()
    )
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    db.delete(override)
    db.commit()


# ── Public: Slot availability ─────────────────────────────────────────────────

@router.get("/slots/{username}/{slug}", response_model=List[AvailableSlot])
def get_slots(
    username: str,
    slug: str,
    date_str: str = Query(..., alias="date", description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    """
    PUBLIC endpoint.
    Returns available time slots for a given username, event slug, and date.
    Called by the public booking calendar when a guest selects a date.
    """
    from app.models.user import User as UserModel

    # Parse date
    try:
        requested_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Validate not in the past
    if requested_date < date.today():
        return []

    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    event_type = (
        db.query(EventType)
        .filter(
            EventType.user_id == user.id,
            EventType.slug == slug,
            EventType.is_active == True,
        )
        .first()
    )
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")

    # Check max_booking_days
    max_date = date.today() + timedelta(days=event_type.max_booking_days)
    if requested_date > max_date:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot book more than {event_type.max_booking_days} days in advance"
        )

    # Get default schedule
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(
            AvailabilitySchedule.user_id == user.id,
            AvailabilitySchedule.is_default == True,
        )
        .first()
    )
    if not schedule:
        # Fallback: first schedule
        schedule = (
            db.query(AvailabilitySchedule)
            .filter(AvailabilitySchedule.user_id == user.id)
            .first()
        )
    if not schedule:
        return []

    return get_available_slots(db, user.id, event_type, requested_date, schedule)


@router.get("/busy-dates/{username}/{slug}")
def get_busy_dates_for_month(
    username: str,
    slug: str,
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    PUBLIC endpoint.
    Returns list of dates in the given month that are fully unavailable.
    Frontend calendar uses this to grey out/disable dates.
    """
    from app.models.user import User as UserModel
    from calendar import monthrange

    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    event_type = (
        db.query(EventType)
        .filter(EventType.user_id == user.id, EventType.slug == slug, EventType.is_active == True)
        .first()
    )
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")

    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.user_id == user.id, AvailabilitySchedule.is_default == True)
        .first()
    )
    if not schedule:
        schedule = db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == user.id
        ).first()
    if not schedule:
        # All dates are busy
        _, days_in_month = monthrange(year, month)
        return {"busy_dates": [date(year, month, d).isoformat() for d in range(1, days_in_month + 1)]}

    _, days_in_month = monthrange(year, month)
    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)

    busy = get_busy_dates(db, user.id, event_type, schedule, month_start, month_end)
    return {"busy_dates": [d.isoformat() for d in busy]}
