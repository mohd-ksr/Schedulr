from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Time, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class AvailabilitySchedule(Base):
    """
    A named availability schedule owned by a user.
    Users can have multiple schedules (e.g. 'Work Hours', 'Weekend Hours').
    One schedule is marked as default.

    Schema:
        users 1 ──< availability_schedules 1 ──< availability_rules
                                                ──< date_overrides
    """
    __tablename__ = "availability_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="Working Hours")
    timezone = Column(String(100), nullable=False, default="UTC")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="availability_schedules")
    rules = relationship("AvailabilityRule", back_populates="schedule", cascade="all, delete-orphan")
    date_overrides = relationship("DateOverride", back_populates="schedule", cascade="all, delete-orphan")


class AvailabilityRule(Base):
    """
    Defines working hours for a specific day of the week.
    day_of_week: 0 = Monday ... 6 = Sunday (ISO weekday - 1)

    Example:
        Monday (0): 09:00 → 17:00, is_available = True
        Saturday (5): is_available = False (day off)
    """
    __tablename__ = "availability_rules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id", ondelete="CASCADE"), nullable=False, index=True)

    day_of_week = Column(Integer, nullable=False)   # 0=Mon, 1=Tue, ..., 6=Sun
    is_available = Column(Boolean, default=True)
    start_time = Column(Time, nullable=True)         # e.g. 09:00:00
    end_time = Column(Time, nullable=True)           # e.g. 17:00:00

    schedule = relationship("AvailabilitySchedule", back_populates="rules")


class DateOverride(Base):
    """
    Overrides the default schedule for a specific calendar date.

    Use cases:
    - Block a holiday: is_available = False
    - Set different hours for a specific day: is_available = True, custom start/end
    """
    __tablename__ = "date_overrides"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id", ondelete="CASCADE"), nullable=False, index=True)

    date = Column(Date, nullable=False)
    is_available = Column(Boolean, default=False)   # False = blocked day
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    reason = Column(String(200), nullable=True)     # e.g. "Public Holiday", "Out of office"

    schedule = relationship("AvailabilitySchedule", back_populates="date_overrides")
