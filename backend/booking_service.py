"""
Booking Service
===============
Handles:
- Creating a booking (with slot locking via DB-level SELECT FOR UPDATE)
- Cancellation
- Rescheduling (cancel old + create new atomically)
- Token generation for cancel/reschedule public links
"""

import secrets
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.booking import Booking, BookingStatus
from app.models.event_type import EventType
from app.schemas.booking import BookingCreate, BookingRescheduleRequest
from app.services.notification_service import send_booking_confirmation, send_cancellation_email


def _generate_token() -> str:
    """Generates a URL-safe 32-byte (64 hex char) token."""
    return secrets.token_hex(32)


def _compute_end_time(start_time: datetime, duration_minutes: int) -> datetime:
    return start_time + timedelta(minutes=duration_minutes)


def create_booking(db: Session, data: BookingCreate, user_id: int) -> Booking:
    """
    Creates a booking with double-booking protection.

    Strategy:
    - Use a DB transaction with row-level locking via SELECT FOR UPDATE
      on overlapping bookings. If a conflict is found, raise 409.
    - This prevents race conditions when two guests book the same slot
      simultaneously.
    """
    # ── Fetch event type ────────────────────────────────────────────────
    event_type: EventType = (
        db.query(EventType)
        .filter(EventType.id == data.event_type_id, EventType.user_id == user_id)
        .first()
    )
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")

    if not event_type.is_active:
        raise HTTPException(status_code=400, detail="This event type is not accepting bookings")

    # ── Ensure start_time is UTC-aware ──────────────────────────────────
    start_time = data.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=ZoneInfo("UTC"))
    else:
        start_time = start_time.astimezone(ZoneInfo("UTC"))

    end_time = _compute_end_time(start_time, event_type.duration)

    # ── Check min booking notice ────────────────────────────────────────
    now_utc = datetime.now(tz=ZoneInfo("UTC"))
    if start_time < now_utc + timedelta(minutes=event_type.min_booking_notice):
        raise HTTPException(
            status_code=400,
            detail=f"Booking requires at least {event_type.min_booking_notice} minutes notice"
        )

    # ── Lock + check for conflicts (SELECT FOR UPDATE) ──────────────────
    try:
        conflicting = (
            db.execute(
                select(Booking)
                .where(
                    Booking.user_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
                    Booking.start_time < end_time,
                    Booking.end_time > start_time,
                )
                .with_for_update()
            )
            .scalars()
            .first()
        )

        if conflicting:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This time slot is no longer available. Please choose another slot."
            )

        # ── Create the booking ──────────────────────────────────────────
        booking = Booking(
            user_id=user_id,
            event_type_id=data.event_type_id,
            guest_name=data.guest_name,
            guest_email=data.guest_email,
            guest_notes=data.guest_notes,
            guest_timezone=data.guest_timezone,
            start_time=start_time,
            end_time=end_time,
            status=BookingStatus.CONFIRMED,
            cancel_token=_generate_token(),
            reschedule_token=_generate_token(),
            custom_answers=data.custom_answers,
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")

    # ── Send confirmation email (non-blocking, best-effort) ─────────────
    try:
        send_booking_confirmation(booking, event_type)
    except Exception:
        pass  # email failure should not break the booking

    return booking


def cancel_booking(db: Session, cancel_token: str, reason: str | None = None) -> Booking:
    """Cancel a booking by its public cancel_token."""
    booking = (
        db.query(Booking)
        .filter(Booking.cancel_token == cancel_token)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    if booking.status == BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed booking")

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)

    try:
        send_cancellation_email(booking, reason)
    except Exception:
        pass

    return booking


def reschedule_booking(
    db: Session,
    reschedule_token: str,
    data: BookingRescheduleRequest,
    user_id: int,
) -> Booking:
    """
    Reschedule by:
    1. Finding old booking via reschedule_token
    2. Creating a new booking for the new slot
    3. Marking old booking as RESCHEDULED
    All in one transaction.
    """
    old_booking = (
        db.query(Booking)
        .filter(Booking.reschedule_token == reschedule_token)
        .first()
    )
    if not old_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if old_booking.status not in [BookingStatus.CONFIRMED, BookingStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Only active bookings can be rescheduled")

    # Create new booking for the new slot
    new_data = BookingCreate(
        event_type_id=old_booking.event_type_id,
        guest_name=old_booking.guest_name,
        guest_email=old_booking.guest_email,
        guest_notes=old_booking.guest_notes,
        guest_timezone=data.guest_timezone or old_booking.guest_timezone,
        start_time=data.new_start_time,
        custom_answers=old_booking.custom_answers,
    )

    new_booking = create_booking(db, new_data, user_id)

    # Mark old booking as rescheduled
    old_booking.status = BookingStatus.RESCHEDULED
    new_booking.rescheduled_from_id = old_booking.id
    db.commit()
    db.refresh(new_booking)

    return new_booking


def get_booking_by_id(db: Session, booking_id: int, user_id: int) -> Booking:
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


def admin_cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    """Admin-side cancellation from the dashboard."""
    booking = get_booking_by_id(db, booking_id, user_id)
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Already cancelled")
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking
