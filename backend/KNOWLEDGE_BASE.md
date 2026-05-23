# Scheduling Platform Backend Knowledge Base

This file is the current backend reference for the FastAPI scheduling platform.
Use it before changing code or wiring a frontend to the API.

## 1. Current Backend Summary

This backend is a Cal.com-style scheduling API built with FastAPI, SQLAlchemy,
Pydantic v2, JWT bearer authentication, and PostgreSQL.

It currently supports:

- User registration and login
- Swagger OAuth2 authorization through `/api/auth/token`
- JWT-protected host/admin endpoints
- Event type CRUD
- Public user profiles and public event type lookup
- Availability schedules with weekly rules
- Date overrides for holidays or custom hours
- Public available-slot calculation
- Busy-date calculation for calendar disabling
- Public guest booking
- Public guest cancel and reschedule by token
- Host booking dashboard with filters
- Optional SMTP emails that fail gracefully when unconfigured

## 2. Runbook

Recommended local development setup:

```bash
cd /Users/apple/Desktop/scaler/backend
source venv/bin/activate
docker compose up -d db
python -m app.db.seed
uvicorn main:app --reload
```

Useful URLs:

| URL | Purpose |
|---|---|
| `http://127.0.0.1:8000/` | Root API metadata |
| `http://127.0.0.1:8000/health` | Health check |
| `http://127.0.0.1:8000/docs` | Swagger UI |
| `http://127.0.0.1:8000/redoc` | ReDoc |
| `http://127.0.0.1:8000/openapi.json` | OpenAPI schema |

Local `.env`:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5433/scheduling_db
APP_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DEFAULT_USER_ID=1
DEFAULT_USER_NAME=Kausar
DEFAULT_USER_EMAIL=mohd.ksr@gmail.com
DEFAULT_USER_USERNAME=kausar
DEFAULT_USER_TIMEZONE=Asia/Kolkata
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@scheduling.com
```

Docker Compose services:

| Service | Purpose | Ports |
|---|---|---|
| `db` | PostgreSQL 16 | host `5433` -> container `5432` |
| `backend` | FastAPI app | host `8000` -> container `8000` |

## 3. Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI |
| Server | Uvicorn |
| Language | Python 3.12 |
| ORM | SQLAlchemy |
| Validation | Pydantic v2 |
| Settings | pydantic-settings + `.env` |
| Auth | JWT with `python-jose`; bcrypt password hashes |
| Database | PostgreSQL |
| Containerization | Docker + Docker Compose |
| Email | SMTP via Python stdlib `smtplib` |

## 4. File Structure

```text
backend/
├── main.py                  # FastAPI app, CORS, router registration, dev startup
├── run.py                   # Alternative local runner: python run.py
├── config.py                # Settings loaded from .env
├── database.py              # SQLAlchemy engine, SessionLocal, Base, get_db
├── security.py              # Password hash/verify and JWT encode/decode
├── auth.py                  # Register, JSON login, Swagger token login
├── users.py                 # Current-user dependency and user routes
├── event_types.py           # Event type admin/public routes
├── bookings.py              # Booking public/admin routes
├── availability.py          # Availability schedule/rule/override models
├── user.py                  # User model
├── event_type.py            # EventType and LocationType model/enum
├── booking.py               # Booking and BookingStatus model/enum
├── custom_question.py       # CustomQuestion model/enum
├── availability_engine.py   # Slot and busy-date calculation
├── booking_service.py       # Booking create/cancel/reschedule logic
├── notification_service.py  # Optional email notifications
├── seed.py                  # Demo data
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── env.py
├── script.py.mako
└── app/                     # Compatibility package used by app.* imports
```

Important compatibility detail:

- The main app is defined in root `main.py`.
- `app/main.py` re-exports `main.app`.
- `app/api/routes/*.py`, `app/core/*.py`, `app/db/*.py`, `app/models/*.py`,
  and `app/services/*.py` mostly wrap root files.
- Both `uvicorn main:app --reload` and `uvicorn app.main:app --reload` can work,
  but the README recommends `uvicorn main:app --reload`.

## 5. Data Model

### Relationship Overview

```text
users
 ├── event_types
 │    ├── bookings
 │    └── custom_questions
 ├── availability_schedules
 │    ├── availability_rules
 │    └── date_overrides
 └── bookings
```

### `users`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `name` | Display name |
| `email` | Unique email; used for login |
| `username` | Unique public profile identifier |
| `hashed_password` | bcrypt hash |
| `bio` | Optional profile bio |
| `timezone` | IANA timezone, default `UTC` |
| `avatar_url` | Optional image URL |
| `is_active` | Login/profile visibility flag |
| `created_at`, `updated_at` | Timestamps |

### `event_types`

| Column | Notes |
|---|---|
| `id`, `user_id` | Primary key and owner FK |
| `title` | Event title |
| `slug` | Public URL slug; unique per user |
| `description` | Optional details |
| `duration` | Meeting length in minutes |
| `color` | UI color |
| `location_type` | `in_person`, `phone`, `google_meet`, `zoom`, `teams`, `custom` |
| `location_value` | Optional address/URL/custom value |
| `is_active` | If false, cannot be booked |
| `is_hidden` | Hidden from public list when true |
| `buffer_before`, `buffer_after` | Minutes of buffer around bookings |
| `min_booking_notice` | Minimum minutes before a booking can start |
| `max_booking_days` | Maximum days into the future guests can book |
| `created_at`, `updated_at` | Timestamps |

### `availability_schedules`

| Column | Notes |
|---|---|
| `id`, `user_id` | Primary key and owner FK |
| `name` | Schedule name |
| `timezone` | Timezone for weekly rules |
| `is_default` | Preferred schedule for public slot lookup |
| `created_at` | Timestamp |

### `availability_rules`

| Column | Notes |
|---|---|
| `id`, `schedule_id` | Primary key and schedule FK |
| `day_of_week` | `0=Monday` through `6=Sunday` |
| `is_available` | Whether this weekday is open |
| `start_time`, `end_time` | Local schedule-time window |

### `date_overrides`

| Column | Notes |
|---|---|
| `id`, `schedule_id` | Primary key and schedule FK |
| `date` | Specific calendar date |
| `is_available` | False blocks the date; true uses custom hours |
| `start_time`, `end_time` | Optional custom local-time window |
| `reason` | Optional label such as holiday or out of office |

### `bookings`

| Column | Notes |
|---|---|
| `id`, `user_id`, `event_type_id` | Primary key and FKs |
| `guest_name`, `guest_email` | Guest identity |
| `guest_notes` | Optional notes |
| `guest_timezone` | Display timezone for the guest |
| `start_time`, `end_time` | UTC-aware timestamps |
| `status` | `pending`, `confirmed`, `cancelled`, `rescheduled`, `completed` |
| `cancel_token` | Public cancel/detail token |
| `reschedule_token` | Public reschedule token |
| `rescheduled_from_id` | Previous booking when rescheduled |
| `meeting_url` | Optional online meeting URL |
| `custom_answers` | JSON string for booking-form answers |
| `created_at`, `updated_at` | Timestamps |

### `custom_questions`

The model exists for bonus custom booking questions, related to event types.
There are currently no CRUD API routes for custom questions.

| Column | Notes |
|---|---|
| `event_type_id` | Owner event type |
| `label`, `placeholder` | Question text |
| `question_type` | `text`, `textarea`, `select`, `checkbox`, `phone` |
| `is_required` | Required flag |
| `options` | JSON array string for select options |
| `order_index` | Display order |

## 6. Authentication

### Login Flows

The API has two login endpoints on purpose:

| Endpoint | Input | Used by |
|---|---|---|
| `POST /api/auth/login` | JSON body with `email`, `password` | Frontend clients, curl, Postman |
| `POST /api/auth/token` | OAuth2 form fields `username`, `password` | Swagger Authorize button |

Swagger uses OAuth2 password flow conventions, so the field is named
`username`. In this backend, put the user's email in that field.

Swagger demo credentials after seeding:

```text
username: john@example.com
password: password123
client_id: leave empty
client_secret: leave empty
```

Protected routes require:

```text
Authorization: Bearer <access_token>
```

`users.get_current_user()` decodes the JWT `sub`, loads the active user, and
raises `401` for missing, expired, invalid, or inactive users.

## 7. Complete Endpoint Reference

Base URL:

```text
http://127.0.0.1:8000
```

### Root

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Returns API name plus docs and health links |
| GET | `/health` | Public | Returns `{"status": "ok", "version": "1.0.0"}` |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Creates user, creates default Mon-Fri 9-18 schedule, returns token and user |
| POST | `/api/auth/login` | Public | JSON login with email/password, returns token and user |
| POST | `/api/auth/token` | Public | OAuth2 form login for Swagger, returns token and user |

Register request:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "username": "janedoe",
  "password": "password123",
  "bio": "Optional bio",
  "timezone": "Asia/Kolkata",
  "avatar_url": null
}
```

Login request:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Auth response:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "bio": null,
    "timezone": "Asia/Kolkata",
    "avatar_url": null,
    "is_active": true,
    "created_at": "..."
  }
}
```

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Current authenticated user profile |
| PATCH | `/api/users/me` | Bearer | Update current user's editable fields |
| GET | `/api/users/{username}` | Public | Public profile lookup |

Patch user body supports:

```json
{
  "name": "Jane Updated",
  "bio": "New bio",
  "timezone": "Asia/Kolkata",
  "avatar_url": "https://example.com/avatar.png"
}
```

### Event Types

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/event-types` | Bearer | List all event types for the current user |
| POST | `/api/event-types` | Bearer | Create an event type |
| GET | `/api/event-types/{event_type_id}` | Bearer | Get one owned event type |
| PATCH | `/api/event-types/{event_type_id}` | Bearer | Update one owned event type |
| DELETE | `/api/event-types/{event_type_id}` | Bearer | Delete one owned event type |
| GET | `/api/event-types/public/{username}` | Public | List active, non-hidden public event types |
| GET | `/api/event-types/public/{username}/{slug}` | Public | Get one active public event type |

Create event type body:

```json
{
  "title": "30 Min Consultation",
  "slug": "consultation",
  "description": "A 30-minute call",
  "duration": 30,
  "color": "#0EA5E9",
  "location_type": "google_meet",
  "location_value": null,
  "is_active": true,
  "is_hidden": false,
  "buffer_before": 0,
  "buffer_after": 10,
  "min_booking_notice": 60,
  "max_booking_days": 60
}
```

Slug validation:

- Lowercase letters, numbers, and hyphens only
- Must be unique per user
- Example valid slug: `code-review`

Public event type response intentionally returns fewer fields:

```json
{
  "id": 1,
  "title": "30 Min Consultation",
  "slug": "consultation",
  "description": "A 30-minute call",
  "duration": 30,
  "color": "#0EA5E9",
  "location_type": "google_meet"
}
```

### Availability

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/availability/schedules` | Bearer | List current user's schedules |
| POST | `/api/availability/schedules` | Bearer | Create schedule with optional rules |
| GET | `/api/availability/schedules/{schedule_id}` | Bearer | Get owned schedule with rules and overrides |
| PUT | `/api/availability/schedules/{schedule_id}` | Bearer | Update schedule; replacing `rules` replaces all rules |
| DELETE | `/api/availability/schedules/{schedule_id}` | Bearer | Delete owned schedule |
| POST | `/api/availability/schedules/{schedule_id}/overrides` | Bearer | Create or update override for one date |
| DELETE | `/api/availability/schedules/{schedule_id}/overrides/{override_id}` | Bearer | Delete one override |
| GET | `/api/availability/slots/{username}/{slug}?date=YYYY-MM-DD` | Public | Return bookable slots for a public event |
| GET | `/api/availability/busy-dates/{username}/{slug}?year=YYYY&month=M` | Public | Return dates with no slots in that month |

Create schedule body:

```json
{
  "name": "Working Hours",
  "timezone": "Asia/Kolkata",
  "is_default": true,
  "rules": [
    {
      "day_of_week": 0,
      "is_available": true,
      "start_time": "09:00:00",
      "end_time": "18:00:00"
    },
    {
      "day_of_week": 6,
      "is_available": false,
      "start_time": null,
      "end_time": null
    }
  ]
}
```

Date override body:

```json
{
  "date": "2026-06-01",
  "is_available": false,
  "start_time": null,
  "end_time": null,
  "reason": "Holiday"
}
```

Custom-hours override:

```json
{
  "date": "2026-06-02",
  "is_available": true,
  "start_time": "12:00:00",
  "end_time": "16:00:00",
  "reason": "Half day"
}
```

Slots response:

```json
[
  {
    "start": "2026-06-03T03:30:00Z",
    "end": "2026-06-03T04:00:00Z",
    "start_local": "2026-06-03T09:00:00",
    "end_local": "2026-06-03T09:30:00"
  }
]
```

Slot lookup behavior:

- Past dates return an empty array.
- Dates beyond `event_type.max_booking_days` return `400`.
- If no schedule exists, slots return an empty array.
- The default schedule is used first; if no default exists, the first schedule is used.
- Date overrides beat weekly rules.
- Blocked overrides return no slots.
- Available overrides use override start/end hours.
- Existing `confirmed` and `pending` bookings block overlapping slots.
- Buffers and minimum booking notice are applied.

Busy-dates response:

```json
{
  "busy_dates": ["2026-06-01", "2026-06-08"]
}
```

### Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Public | Guest creates a booking |
| GET | `/api/bookings/token/{cancel_token}` | Public | Guest gets booking details by cancel token |
| POST | `/api/bookings/cancel/{cancel_token}` | Public | Guest cancels booking by token |
| POST | `/api/bookings/reschedule/{reschedule_token}` | Public | Guest reschedules booking by token |
| GET | `/api/bookings/admin` | Bearer | Host dashboard list split into upcoming and past |
| GET | `/api/bookings/admin/{booking_id}` | Bearer | Host gets one owned booking |
| POST | `/api/bookings/admin/{booking_id}/cancel` | Bearer | Host cancels one owned booking |

Create booking body:

```json
{
  "event_type_id": 1,
  "guest_name": "Guest User",
  "guest_email": "guest@example.com",
  "guest_notes": "Optional notes",
  "guest_timezone": "Asia/Kolkata",
  "start_time": "2026-06-03T03:30:00Z",
  "custom_answers": "{\"topic\":\"System design\"}"
}
```

Public booking response:

```json
{
  "id": 10,
  "guest_name": "Guest User",
  "guest_email": "guest@example.com",
  "start_time": "2026-06-03T03:30:00Z",
  "end_time": "2026-06-03T04:00:00Z",
  "status": "confirmed",
  "cancel_token": "...",
  "reschedule_token": "...",
  "meeting_url": null,
  "event_type": {
    "id": 1,
    "title": "30 Min Consultation",
    "slug": "consultation",
    "description": "A 30-minute call",
    "duration": 30,
    "color": "#0EA5E9",
    "location_type": "google_meet"
  }
}
```

Cancel body:

```json
{
  "reason": "I cannot attend"
}
```

Reschedule body:

```json
{
  "new_start_time": "2026-06-04T05:00:00Z",
  "guest_timezone": "Asia/Kolkata"
}
```

Admin list filters:

| Query param | Description |
|---|---|
| `status` | One of `pending`, `confirmed`, `cancelled`, `rescheduled`, `completed` |
| `event_type_id` | Filter by event type |
| `search` | Case-insensitive guest name/email search |

Admin list response:

```json
{
  "upcoming": [],
  "past": []
}
```

Booking rules:

- `start_time` is normalized to UTC.
- `end_time` is calculated from event type duration.
- Inactive event types reject booking with `400`.
- Slots too close to now reject with `400`.
- Overlapping active bookings reject with `409`.
- Cancelling an already cancelled booking rejects with `400`.
- Completed bookings cannot be cancelled by guest token.
- Rescheduling creates a new booking and marks the old booking `rescheduled`.

## 8. Availability Engine

Primary function:

```python
get_available_slots(db, user_id, event_type, requested_date, schedule)
```

Algorithm:

1. Look for a date override for the requested date.
2. If override exists and `is_available` is false, return no slots.
3. If override exists and `is_available` is true, use override hours.
4. Otherwise find the weekly rule for `requested_date.weekday()`.
5. Convert the local schedule window to UTC.
6. Generate non-overlapping candidate slots using `event_type.duration`.
7. Remove slots earlier than `now + min_booking_notice`.
8. Load existing `confirmed` and `pending` bookings for that user/date window.
9. Remove slots overlapping active bookings, considering buffers.
10. Return UTC and host-local strings.

Busy dates call `get_available_slots()` for each date in the month and mark days
with no slots as busy.

## 9. Booking Service

Primary functions:

| Function | Responsibility |
|---|---|
| `create_booking` | Validates event type, normalizes time, checks conflicts, creates booking |
| `cancel_booking` | Cancels by public cancel token |
| `reschedule_booking` | Creates new booking and marks old one rescheduled |
| `admin_cancel_booking` | Host-side cancellation by booking id |

Conflict prevention:

```python
select(Booking)
    .where(
        Booking.user_id == user_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        Booking.start_time < end_time,
        Booking.end_time > start_time,
    )
    .with_for_update()
```

If a conflict exists, the API returns `409 Conflict`.

## 10. Development Schema Behavior

In `APP_ENV=development`, startup runs:

```python
Base.metadata.create_all(bind=engine)
```

It also runs a small dev patch in `ensure_dev_schema_updates()` to add
`users.hashed_password` if an older local database is missing it and to ensure
the seeded `john@example.com` user has the password `password123`.

Alembic files are present, but there is no active versions directory in the
current project. For production, create real migrations before deploying schema
changes:

```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

## 11. Seed Data

Run:

```bash
python -m app.db.seed
```

Seed behavior:

- If any user already exists, seeding skips.
- Creates demo user `John Doe`
- Email: `john@example.com`
- Username: `johndoe`
- Password: `password123`
- Timezone: `Asia/Kolkata`

Seeded event types:

| Slug | Title | Duration | Notes |
|---|---|---|---|
| `quick-chat` | `15 Min Quick Chat` | 15 | Google Meet, 5 minute buffer after |
| `consultation` | `30 Min Consultation` | 30 | Zoom, 10 minute buffer after |
| `code-review` | `1 Hour Code Review` | 60 | Google Meet, 10 minute buffer before/after |

Seeded availability:

- Schedule name: `Working Hours`
- Timezone: `Asia/Kolkata`
- Mon-Fri: 09:00-18:00
- Sat-Sun: unavailable
- One upcoming Monday blocked as `Public Holiday`

Seeded bookings:

- 3 past bookings
- 2 upcoming bookings

## 12. Common Manual Tests

### Health

```bash
curl http://127.0.0.1:8000/health
```

### Login

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Current User

```bash
curl http://127.0.0.1:8000/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Public Event Types

```bash
curl http://127.0.0.1:8000/api/event-types/public/johndoe
```

### Slots

```bash
curl "http://127.0.0.1:8000/api/availability/slots/johndoe/consultation?date=2026-06-03"
```

### Book

```bash
curl -X POST http://127.0.0.1:8000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "event_type_id": 1,
    "guest_name": "Guest User",
    "guest_email": "guest@example.com",
    "guest_timezone": "Asia/Kolkata",
    "start_time": "2026-06-03T03:30:00Z"
  }'
```

## 13. Frontend Integration Notes

Suggested frontend flow:

1. Register/login host with `/api/auth/register` or `/api/auth/login`.
2. Store `access_token`.
3. Send `Authorization: Bearer <token>` for host dashboard APIs.
4. Public profile page calls `/api/users/{username}`.
5. Public event cards call `/api/event-types/public/{username}`.
6. Booking page calls `/api/event-types/public/{username}/{slug}`.
7. Calendar calls `/api/availability/busy-dates/{username}/{slug}`.
8. Date selection calls `/api/availability/slots/{username}/{slug}?date=...`.
9. Booking form posts to `/api/bookings`.
10. Cancel/reschedule pages use returned public tokens.

## 14. Known Gaps And Notes

- Custom question model exists, but no custom-question API routes are currently exposed.
- `meeting_url` is stored but not auto-generated by an external meeting provider.
- Email sending is best-effort and skipped when SMTP credentials are missing.
- Booking creation checks overlaps directly; frontend should still call the slots endpoint
  first for the best user experience.
- Seed script skips if any user exists, so reset the database volume if you need fresh
  seeded data from scratch.
