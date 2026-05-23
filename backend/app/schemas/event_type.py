import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.event_type import LocationType


class EventTypeBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    duration: int = 30
    color: str = "#0EA5E9"
    location_type: LocationType = LocationType.GOOGLE_MEET
    location_value: Optional[str] = None
    is_active: bool = True
    is_hidden: bool = False
    buffer_before: int = 0
    buffer_after: int = 0
    min_booking_notice: int = 60
    max_booking_days: int = 60


class EventTypeCreate(EventTypeBase):
    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens only")
        return v

    @field_validator("duration")
    @classmethod
    def duration_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v


class EventTypeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    color: Optional[str] = None
    location_type: Optional[LocationType] = None
    location_value: Optional[str] = None
    is_active: Optional[bool] = None
    is_hidden: Optional[bool] = None
    buffer_before: Optional[int] = None
    buffer_after: Optional[int] = None
    min_booking_notice: Optional[int] = None
    max_booking_days: Optional[int] = None


class EventTypeOut(EventTypeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventTypePublic(BaseModel):
    id: int
    title: str
    slug: str
    description: Optional[str] = None
    duration: int
    color: str
    location_type: LocationType

    class Config:
        from_attributes = True

