from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.routes.users import get_current_user
from app.db.database import get_db
from app.models.availability import AvailabilityRule, AvailabilitySchedule, DateOverride
from app.models.event_type import EventType
from app.models.user import User
from app.schemas.availability import (
    AvailabilityScheduleCreate,
    AvailabilityScheduleOut,
    AvailabilityScheduleUpdate,
    AvailableSlot,
    DateOverrideCreate,
    DateOverrideOut,
)
from app.services.availability_engine import get_available_slots, get_busy_dates

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.get("/schedules", response_model=List[AvailabilityScheduleOut])
def list_schedules(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
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
    user: User = Depends(get_current_user),
):
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
    db.flush()

    for rule_data in payload.rules:
        db.add(AvailabilityRule(schedule_id=schedule.id, **rule_data.model_dump()))

    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/schedules/{schedule_id}", response_model=AvailabilityScheduleOut)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


@router.put("/schedules/{schedule_id}", response_model=AvailabilityScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: AvailabilityScheduleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
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
        db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == user.id,
            AvailabilitySchedule.id != schedule_id,
        ).update({"is_default": False})
        schedule.is_default = True

    if payload.rules is not None:
        db.query(AvailabilityRule).filter(AvailabilityRule.schedule_id == schedule_id).delete()
        for rule_data in payload.rules:
            db.add(AvailabilityRule(schedule_id=schedule_id, **rule_data.model_dump()))

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
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


@router.post("/schedules/{schedule_id}/overrides", response_model=DateOverrideOut, status_code=201)
def add_date_override(
    schedule_id: int,
    payload: DateOverrideCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.id == schedule_id, AvailabilitySchedule.user_id == user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

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
    user: User = Depends(get_current_user),
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


@router.get("/slots/{username}/{slug}", response_model=List[AvailableSlot])
def get_slots(
    username: str,
    slug: str,
    date_str: str = Query(..., alias="date", description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    try:
        requested_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if requested_date < date.today():
        return []

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    event_type = (
        db.query(EventType)
        .filter(EventType.user_id == user.id, EventType.slug == slug, EventType.is_active == True)
        .first()
    )
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")

    max_date = date.today() + timedelta(days=event_type.max_booking_days)
    if requested_date > max_date:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot book more than {event_type.max_booking_days} days in advance",
        )

    schedule = (
        db.query(AvailabilitySchedule)
        .filter(AvailabilitySchedule.user_id == user.id, AvailabilitySchedule.is_default == True)
        .first()
    )
    if not schedule:
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
    from calendar import monthrange

    user = db.query(User).filter(User.username == username).first()
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
        schedule = (
            db.query(AvailabilitySchedule)
            .filter(AvailabilitySchedule.user_id == user.id)
            .first()
        )

    _, days_in_month = monthrange(year, month)
    if not schedule:
        return {"busy_dates": [date(year, month, d).isoformat() for d in range(1, days_in_month + 1)]}

    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)
    busy = get_busy_dates(db, user.id, event_type, schedule, month_start, month_end)
    return {"busy_dates": [d.isoformat() for d in busy]}
