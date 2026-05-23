from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING    = "pending"      # awaiting confirmation (if manual confirm enabled)
    CONFIRMED  = "confirmed"    # active booking
    CANCELLED  = "cancelled"    # cancelled by guest or host
    RESCHEDULED = "rescheduled" # replaced by a new booking
    COMPLETED  = "completed"    # past meeting, auto-set by system


class Booking(Base):
    """
    A single booking instance created when a guest books a slot.

    Key design decisions:
    - start_time / end_time stored in UTC always
    - guest_timezone stored for display conversion on confirmation
    - cancel_token: unique token for the public cancel/reschedule link (no auth needed)

    Anti-double-booking:
    - Enforced at service layer with SELECT FOR UPDATE
    - unique constraint on (event_type_id, start_time) for non-cancelled bookings
      is handled via partial index in migration
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id", ondelete="CASCADE"), nullable=False, index=True)

    # Guest details
    guest_name = Column(String(100), nullable=False)
    guest_email = Column(String(255), nullable=False, index=True)
    guest_notes = Column(Text, nullable=True)
    guest_timezone = Column(String(100), nullable=False, default="UTC")

    # Time (always UTC)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)

    # Status
    status = Column(
        SAEnum(BookingStatus, name="booking_status_enum"),
        nullable=False,
        default=BookingStatus.CONFIRMED,
    )

    # Tokens for public cancel/reschedule links (no login required for guest)
    cancel_token = Column(String(64), unique=True, nullable=False, index=True)
    reschedule_token = Column(String(64), unique=True, nullable=False, index=True)

    # Optional: if this booking was rescheduled FROM another booking
    rescheduled_from_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)

    # Meeting link (e.g. Zoom / Meet URL)
    meeting_url = Column(String(500), nullable=True)

    # Custom question answers (JSON-encoded, simple approach)
    custom_answers = Column(Text, nullable=True)  # JSON string

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="bookings")
    event_type = relationship("EventType", back_populates="bookings")
    rescheduled_from = relationship("Booking", remote_side="Booking.id", foreign_keys=[rescheduled_from_id])
