"""
Seed Script
===========
Populates the database with:
- 1 default admin user
- 3 event types
- 1 default availability schedule (Mon-Fri 9-5, IST)
- Several sample bookings (past + upcoming)

Run: python -m app.db.seed
"""

from datetime import datetime, timedelta, time, date
from zoneinfo import ZoneInfo
import secrets

from app.db.database import SessionLocal, engine
from app.db import database
from app.core.security import get_password_hash
from app.models import (
    User, EventType, AvailabilitySchedule, AvailabilityRule,
    DateOverride, Booking, BookingStatus, LocationType
)
# Ensure all models are registered with Base before create_all
from app.db.database import Base
import app.models  # noqa


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Skip if already seeded ──────────────────────────────────────
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── 1. Default User ─────────────────────────────────────────────
        user = User(
            id=1,
            name="John Doe",
            email="john@example.com",
            username="johndoe",
            hashed_password=get_password_hash("password123"),
            bio="Full-stack developer. Book a call with me!",
            timezone="Asia/Kolkata",
            is_active=True,
        )
        db.add(user)
        db.flush()

        # ── 2. Event Types ──────────────────────────────────────────────
        et1 = EventType(
            user_id=user.id,
            title="15 Min Quick Chat",
            slug="quick-chat",
            description="A brief 15-minute call to discuss anything on your mind.",
            duration=15,
            color="#10B981",
            location_type=LocationType.GOOGLE_MEET,
            is_active=True,
            buffer_after=5,
            min_booking_notice=30,
            max_booking_days=30,
        )

        et2 = EventType(
            user_id=user.id,
            title="30 Min Consultation",
            slug="consultation",
            description="A 30-minute deep dive into your project or idea.",
            duration=30,
            color="#0EA5E9",
            location_type=LocationType.ZOOM,
            is_active=True,
            buffer_after=10,
            min_booking_notice=60,
            max_booking_days=60,
        )

        et3 = EventType(
            user_id=user.id,
            title="1 Hour Code Review",
            slug="code-review",
            description="Detailed code review and architecture discussion.",
            duration=60,
            color="#8B5CF6",
            location_type=LocationType.GOOGLE_MEET,
            is_active=True,
            buffer_before=10,
            buffer_after=10,
            min_booking_notice=120,
            max_booking_days=45,
        )

        db.add_all([et1, et2, et3])
        db.flush()

        # ── 3. Default Availability Schedule ────────────────────────────
        schedule = AvailabilitySchedule(
            user_id=user.id,
            name="Working Hours",
            timezone="Asia/Kolkata",
            is_default=True,
        )
        db.add(schedule)
        db.flush()

        # Mon–Fri: 9 AM – 6 PM IST. Sat–Sun: off.
        working_days = [0, 1, 2, 3, 4]  # Mon=0 ... Fri=4
        rules = []
        for dow in range(7):
            rule = AvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=dow,
                is_available=dow in working_days,
                start_time=time(9, 0) if dow in working_days else None,
                end_time=time(18, 0) if dow in working_days else None,
            )
            rules.append(rule)
        db.add_all(rules)

        # ── 4. Date Override — block a day example ──────────────────────
        # Block next Monday as a holiday example
        today = date.today()
        days_until_monday = (7 - today.weekday()) % 7 or 7
        next_monday = today + timedelta(days=days_until_monday)

        override = DateOverride(
            schedule_id=schedule.id,
            date=next_monday,
            is_available=False,
            reason="Public Holiday",
        )
        db.add(override)

        # ── 5. Sample Bookings ──────────────────────────────────────────
        ist = ZoneInfo("Asia/Kolkata")
        utc = ZoneInfo("UTC")

        def make_utc(year, month, day, hour, minute=0):
            naive_ist = datetime(year, month, day, hour, minute)
            ist_aware = naive_ist.replace(tzinfo=ist)
            return ist_aware.astimezone(utc)

        now = datetime.now(tz=utc)

        # Past bookings
        past_bookings = [
            Booking(
                user_id=user.id,
                event_type_id=et1.id,
                guest_name="Alice Johnson",
                guest_email="alice@example.com",
                guest_timezone="Asia/Kolkata",
                start_time=now - timedelta(days=10, hours=2),
                end_time=now - timedelta(days=10, hours=2) + timedelta(minutes=15),
                status=BookingStatus.COMPLETED,
                cancel_token=secrets.token_hex(32),
                reschedule_token=secrets.token_hex(32),
            ),
            Booking(
                user_id=user.id,
                event_type_id=et2.id,
                guest_name="Bob Smith",
                guest_email="bob@example.com",
                guest_timezone="America/New_York",
                start_time=now - timedelta(days=5, hours=3),
                end_time=now - timedelta(days=5, hours=3) + timedelta(minutes=30),
                status=BookingStatus.CANCELLED,
                cancel_token=secrets.token_hex(32),
                reschedule_token=secrets.token_hex(32),
            ),
            Booking(
                user_id=user.id,
                event_type_id=et3.id,
                guest_name="Carol White",
                guest_email="carol@example.com",
                guest_timezone="Europe/London",
                start_time=now - timedelta(days=2, hours=1),
                end_time=now - timedelta(days=2, hours=1) + timedelta(minutes=60),
                status=BookingStatus.COMPLETED,
                cancel_token=secrets.token_hex(32),
                reschedule_token=secrets.token_hex(32),
            ),
        ]

        # Upcoming bookings (tomorrow and day after — working hours)
        tomorrow = now + timedelta(days=1)
        upcoming_bookings = [
            Booking(
                user_id=user.id,
                event_type_id=et1.id,
                guest_name="David Kumar",
                guest_email="david@example.com",
                guest_notes="Want to discuss a startup idea",
                guest_timezone="Asia/Kolkata",
                start_time=(tomorrow.replace(hour=4, minute=30, second=0, microsecond=0)),  # 10 AM IST
                end_time=(tomorrow.replace(hour=4, minute=45, second=0, microsecond=0)),    # 10:15 AM IST
                status=BookingStatus.CONFIRMED,
                cancel_token=secrets.token_hex(32),
                reschedule_token=secrets.token_hex(32),
            ),
            Booking(
                user_id=user.id,
                event_type_id=et2.id,
                guest_name="Eve Sharma",
                guest_email="eve@example.com",
                guest_notes="Need help with system design",
                guest_timezone="Asia/Kolkata",
                start_time=(tomorrow.replace(hour=6, minute=0, second=0, microsecond=0)),   # 11:30 AM IST
                end_time=(tomorrow.replace(hour=6, minute=30, second=0, microsecond=0)),
                status=BookingStatus.CONFIRMED,
                cancel_token=secrets.token_hex(32),
                reschedule_token=secrets.token_hex(32),
            ),
        ]

        db.add_all(past_bookings + upcoming_bookings)
        db.execute(
            __import__("sqlalchemy").text(
                """
                SELECT setval(
                    pg_get_serial_sequence('users', 'id'),
                    COALESCE((SELECT MAX(id) FROM users), 1),
                    true
                )
                """
            )
        )
        db.commit()

        print("✅ Seeding complete!")
        print(f"   User: {user.username} (id={user.id})")
        print(f"   Event types: {et1.slug}, {et2.slug}, {et3.slug}")
        print(f"   Schedule: '{schedule.name}' (Mon-Fri, 9-6 IST)")
        print(f"   Bookings: {len(past_bookings)} past, {len(upcoming_bookings)} upcoming")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
