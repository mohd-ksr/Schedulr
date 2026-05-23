from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class LocationType(str, enum.Enum):
    """Where the meeting takes place."""
    IN_PERSON    = "in_person"
    PHONE        = "phone"
    GOOGLE_MEET  = "google_meet"
    ZOOM         = "zoom"
    TEAMS        = "teams"
    CUSTOM       = "custom"


class EventType(Base):
    """
    An event type defines a bookable meeting template.
    e.g. '30 Min Consultation', '1 Hour Code Review'.

    Each event type gets a unique public booking URL:
        /<username>/<slug>
    """
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False, index=True)        # URL-friendly identifier
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False, default=30)        # in minutes
    color = Column(String(20), nullable=False, default="#0EA5E9") # UI color tag

    location_type = Column(
        SAEnum(LocationType, name="location_type_enum"),
        nullable=False,
        default=LocationType.GOOGLE_MEET,
    )
    location_value = Column(String(500), nullable=True)           # custom URL / address

    is_active = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)                    # hidden from public profile

    # Buffer time around meetings (bonus feature)
    buffer_before = Column(Integer, default=0)   # minutes before
    buffer_after = Column(Integer, default=0)    # minutes after

    # Limits
    min_booking_notice = Column(Integer, default=60)  # minutes ahead required to book
    max_booking_days = Column(Integer, default=60)    # how far in future can guests book

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="event_types")
    bookings = relationship("Booking", back_populates="event_type", cascade="all, delete-orphan")
    custom_questions = relationship("CustomQuestion", back_populates="event_type", cascade="all, delete-orphan")

    # Unique slug per user
    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("user_id", "slug", name="uq_event_type_user_slug"),
    )
