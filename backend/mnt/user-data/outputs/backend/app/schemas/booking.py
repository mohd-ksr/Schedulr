from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.booking import BookingStatus
from app.schemas.event_type import EventTypePublic


class BookingCreate(BaseModel):
    event_type_id: int
    guest_name: str
    guest_email: EmailStr
    guest_notes: Optional[str] = None
    guest_timezone: str = "UTC"
    start_time: datetime             # ISO 8601, client sends UTC
    custom_answers: Optional[str] = None   # JSON string


class BookingOut(BaseModel):
    id: int
    guest_name: str
    guest_email: str
    guest_notes: Optional[str] = None
    guest_timezone: str
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    cancel_token: str
    reschedule_token: str
    meeting_url: Optional[str] = None
    created_at: datetime
    event_type: EventTypePublic

    class Config:
        from_attributes = True


class BookingPublicOut(BaseModel):
    """Shown to guest on confirmation page — minimal sensitive data."""
    id: int
    guest_name: str
    guest_email: str
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    cancel_token: str
    reschedule_token: str
    meeting_url: Optional[str] = None
    event_type: EventTypePublic

    class Config:
        from_attributes = True


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None


class BookingRescheduleRequest(BaseModel):
    new_start_time: datetime
    guest_timezone: Optional[str] = None


class BookingListOut(BaseModel):
    upcoming: List[BookingOut]
    past: List[BookingOut]
