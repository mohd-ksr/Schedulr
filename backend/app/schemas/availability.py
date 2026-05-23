from datetime import date, time
from typing import List, Optional

from pydantic import BaseModel, field_validator


class AvailabilityRuleBase(BaseModel):
    day_of_week: int
    is_available: bool = True
    start_time: Optional[time] = None
    end_time: Optional[time] = None

    @field_validator("day_of_week")
    @classmethod
    def valid_day(cls, v: int) -> int:
        if v not in range(7):
            raise ValueError("day_of_week must be 0 (Mon) to 6 (Sun)")
        return v


class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass


class AvailabilityRuleOut(AvailabilityRuleBase):
    id: int

    class Config:
        from_attributes = True


class DateOverrideBase(BaseModel):
    date: date
    is_available: bool = False
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class DateOverrideCreate(DateOverrideBase):
    pass


class DateOverrideOut(DateOverrideBase):
    id: int

    class Config:
        from_attributes = True


class AvailabilityScheduleBase(BaseModel):
    name: str = "Working Hours"
    timezone: str = "UTC"
    is_default: bool = False


class AvailabilityScheduleCreate(AvailabilityScheduleBase):
    rules: List[AvailabilityRuleCreate] = []


class AvailabilityScheduleUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    is_default: Optional[bool] = None
    rules: Optional[List[AvailabilityRuleCreate]] = None


class AvailabilityScheduleOut(AvailabilityScheduleBase):
    id: int
    user_id: int
    rules: List[AvailabilityRuleOut] = []
    date_overrides: List[DateOverrideOut] = []

    class Config:
        from_attributes = True


class AvailableSlot(BaseModel):
    start: str
    end: str
    start_local: str
    end_local: str

