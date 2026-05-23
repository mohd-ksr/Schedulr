from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from zoneinfo import ZoneInfo

from app.db.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import (
    BookingCreate, BookingOut, BookingPublicOut,
    BookingCancelRequest, BookingRescheduleRequest, BookingListOut,
)
from app.services.booking_service import (
    create_booking, cancel_booking, reschedule_booking, admin_cancel_booking,
)
from app.api.routes.users import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# ── Public: Create a booking ─────────────────────────────────────────────────

@router.post("", response_model=BookingPublicOut, status_code=201)
def book_slot(payload: BookingCreate, db: Session = Depends(get_db)):
    """
    PUBLIC endpoint — guest books a slot.
    user_id is resolved from the event_type's owner.
    """
    from app.models.event_type import EventType
    et = db.query(EventType).filter(EventType.id == payload.event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    booking = create_booking(db, payload, et.user_id)
    return booking


# ── Public: Cancel via token ──────────────────────────────────────────────────

@router.post("/cancel/{cancel_token}", response_model=BookingPublicOut)
def cancel_by_token(
    cancel_token: str,
    payload: BookingCancelRequest = BookingCancelRequest(),
    db: Session = Depends(get_db),
):
    """
    PUBLIC endpoint — guest cancels their booking via token link.
    No auth required.
    """
    return cancel_booking(db, cancel_token, payload.reason)


# ── Public: Get booking by cancel/reschedule token ────────────────────────────

@router.get("/token/{cancel_token}", response_model=BookingPublicOut)
def get_booking_by_token(cancel_token: str, db: Session = Depends(get_db)):
    """Get booking details via cancel token — for the confirmation/cancel page."""
    booking = db.query(Booking).filter(Booking.cancel_token == cancel_token).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


# ── Public: Reschedule via token ──────────────────────────────────────────────

@router.post("/reschedule/{reschedule_token}", response_model=BookingPublicOut)
def reschedule_by_token(
    reschedule_token: str,
    payload: BookingRescheduleRequest,
    db: Session = Depends(get_db),
):
    """
    PUBLIC endpoint — guest reschedules via token link.
    Finds the booking's owner from the token, then delegates.
    """
    booking = db.query(Booking).filter(Booking.reschedule_token == reschedule_token).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return reschedule_booking(db, reschedule_token, payload, booking.user_id)


# ── Admin: List bookings dashboard ────────────────────────────────────────────

@router.get("/admin", response_model=BookingListOut)
def list_admin_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    status: Optional[BookingStatus] = Query(None),
    event_type_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None, description="Search by guest name or email"),
):
    """
    Admin dashboard — returns upcoming and past bookings.
    Supports filters: status, event_type_id, search.
    """
    now_utc = datetime.now(tz=ZoneInfo("UTC"))

    base_query = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
    )

    if status:
        base_query = base_query.filter(Booking.status == status)

    if event_type_id:
        base_query = base_query.filter(Booking.event_type_id == event_type_id)

    if search:
        term = f"%{search}%"
        base_query = base_query.filter(
            (Booking.guest_name.ilike(term)) | (Booking.guest_email.ilike(term))
        )

    all_bookings = base_query.order_by(Booking.start_time.asc()).all()

    upcoming = [b for b in all_bookings if b.start_time >= now_utc and b.status != BookingStatus.CANCELLED]
    past = [b for b in all_bookings if b.start_time < now_utc or b.status == BookingStatus.CANCELLED]

    # Sort: upcoming ascending, past descending
    past.sort(key=lambda b: b.start_time, reverse=True)

    return BookingListOut(upcoming=upcoming, past=past)


@router.get("/admin/{booking_id}", response_model=BookingOut)
def get_admin_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single booking detail (admin)."""
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/admin/{booking_id}/cancel", response_model=BookingOut)
def admin_cancel(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Admin cancels a booking from the dashboard."""
    return admin_cancel_booking(db, booking_id, user.id)
