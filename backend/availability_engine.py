"""
Availability Engine
===================
Core logic to compute available booking slots for a given date.

Algorithm:
1. Fetch the user's default availability schedule
2. Check if the requested date has a DateOverride → use override hours or mark blocked
3. Find the rule for that day-of-week → get working window (start_time, end_time)
4. Generate all possible slots within that window using the event_type duration
5. Subtract already-confirmed/pending bookings that overlap
6. Apply min_booking_notice (can't book too close to now)
7. Return the list of free slots

All internal times are UTC. Conversion to host or guest timezone
happens at the API response layer.
"""

from datetime import date, datetime, timedelta, time
from typing import List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from sqlalchemy.orm import Session

from app.models.availability import AvailabilitySchedule, AvailabilityRule, DateOverride
from app.models.booking import Booking, BookingStatus
from app.models.event_type import EventType
from app.schemas.availability import AvailableSlot


def _to_utc(dt: datetime, tz_name: str) -> datetime:
    """Convert a naive datetime in tz_name to UTC-aware datetime."""
    try:
        tz = ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
    return dt.replace(tzinfo=tz).astimezone(ZoneInfo("UTC"))


def _combine_date_time(d: date, t: time, tz_name: str) -> datetime:
    """Combine date + time in the given timezone → UTC-aware datetime."""
    naive = datetime.combine(d, t)
    return _to_utc(naive, tz_name)


def get_available_slots(
    db: Session,
    user_id: int,
    event_type: EventType,
    requested_date: date,
    schedule: AvailabilitySchedule,
) -> List[AvailableSlot]:
    """
    Main entry point.
    Returns a list of available AvailableSlot for the requested_date.
    """
    tz_name = schedule.timezone
    duration_mins = event_type.duration
    buffer_before = event_type.buffer_before
    buffer_after = event_type.buffer_after
    slot_step = duration_mins  # slots are non-overlapping, back-to-back

    # ── 1. Check date override ──────────────────────────────────────────
    override: Optional[DateOverride] = (
        db.query(DateOverride)
        .filter(
            DateOverride.schedule_id == schedule.id,
            DateOverride.date == requested_date,
        )
        .first()
    )

    if override and not override.is_available:
        return []  # blocked date

    # ── 2. Find day-of-week rule ────────────────────────────────────────
    # Python weekday(): Mon=0 … Sun=6 — matches our schema
    dow = requested_date.weekday()

    if override and override.is_available:
        # Override provides custom hours for this date
        window_start_time = override.start_time
        window_end_time = override.end_time
    else:
        rule: Optional[AvailabilityRule] = (
            db.query(AvailabilityRule)
            .filter(
                AvailabilityRule.schedule_id == schedule.id,
                AvailabilityRule.day_of_week == dow,
                AvailabilityRule.is_available == True,
            )
            .first()
        )
        if not rule:
            return []  # not a working day
        window_start_time = rule.start_time
        window_end_time = rule.end_time

    if not window_start_time or not window_end_time:
        return []

    # ── 3. Build window in UTC ──────────────────────────────────────────
    window_start_utc = _combine_date_time(requested_date, window_start_time, tz_name)
    window_end_utc = _combine_date_time(requested_date, window_end_time, tz_name)

    # Handle midnight-crossing schedules (rare but possible)
    if window_end_utc <= window_start_utc:
        window_end_utc += timedelta(days=1)

    # ── 4. Generate candidate slots ─────────────────────────────────────
    now_utc = datetime.now(tz=ZoneInfo("UTC"))
    min_notice_delta = timedelta(minutes=event_type.min_booking_notice)
    earliest_bookable = now_utc + min_notice_delta

    candidate_slots: List[tuple[datetime, datetime]] = []
    current = window_start_utc

    while True:
        slot_start = current
        slot_end = current + timedelta(minutes=duration_mins)
        if slot_end > window_end_utc:
            break
        if slot_start >= earliest_bookable:
            candidate_slots.append((slot_start, slot_end))
        current += timedelta(minutes=slot_step)

    if not candidate_slots:
        return []

    # ── 5. Fetch existing bookings that overlap this date window ────────
    existing_bookings: List[Booking] = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
            Booking.start_time < window_end_utc,
            Booking.end_time > window_start_utc,
        )
        .all()
    )

    # ── 6. Filter out slots that conflict with existing bookings ─────────
    def overlaps(slot_s: datetime, slot_e: datetime, booking: Booking) -> bool:
        """True if slot and booking overlap (considering buffers)."""
        effective_start = slot_s - timedelta(minutes=buffer_before)
        effective_end = slot_e + timedelta(minutes=buffer_after)
        b_start = booking.start_time
        b_end = booking.end_time
        # Add buffers around existing bookings too
        b_effective_start = b_start - timedelta(minutes=buffer_before)
        b_effective_end = b_end + timedelta(minutes=buffer_after)
        return effective_start < b_effective_end and effective_end > b_effective_start

    free_slots: List[AvailableSlot] = []
    host_tz = ZoneInfo(tz_name)

    for slot_start, slot_end in candidate_slots:
        conflict = any(overlaps(slot_start, slot_end, b) for b in existing_bookings)
        if not conflict:
            # Convert to host local for display
            local_start = slot_start.astimezone(host_tz)
            local_end = slot_end.astimezone(host_tz)
            free_slots.append(
                AvailableSlot(
                    start=slot_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    end=slot_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    start_local=local_start.strftime("%Y-%m-%dT%H:%M:%S"),
                    end_local=local_end.strftime("%Y-%m-%dT%H:%M:%S"),
                )
            )

    return free_slots


def get_busy_dates(
    db: Session,
    user_id: int,
    event_type: EventType,
    schedule: AvailabilitySchedule,
    month_start: date,
    month_end: date,
) -> List[date]:
    """
    Returns a list of dates in the given month range that are fully booked
    or unavailable — used by the frontend calendar to grey out dates.
    """
    busy: List[date] = []
    current = month_start

    while current <= month_end:
        slots = get_available_slots(db, user_id, event_type, current, schedule)
        if not slots:
            busy.append(current)
        current += timedelta(days=1)

    return busy
