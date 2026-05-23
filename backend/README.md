# Scheduling Platform Backend

FastAPI + PostgreSQL backend for a Cal.com-style scheduling platform.

The backend supports user auth, event type management, availability schedules,
public slot lookup, guest booking, guest cancel/reschedule links, and an
authenticated bookings dashboard.

## Quick Start

### Local API + Docker Postgres

```bash
cd /Users/apple/Desktop/scaler/backend
source venv/bin/activate

# Start PostgreSQL only. Host port is 5433.
docker compose up -d db

# Optional, but useful for demo data.
python -m app.db.seed

# Start the API.
uvicorn main:app --reload
```

Open:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

### Full Docker Compose

```bash
docker compose up --build
docker compose exec backend python -m app.db.seed
```

Postgres runs inside Docker on container port `5432` and is published to host
port `5433`.

## Environment

Local `.env` should contain:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5433/scheduling_db
APP_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:3000
```

SMTP settings are optional. If SMTP credentials are empty, booking emails are
skipped without breaking booking creation or cancellation.

## Seeded Demo Data

Run:

```bash
python -m app.db.seed
```

Demo login:

```text
email: john@example.com
password: password123
```

Seeded public booking URLs use:

```text
username: johndoe
event slugs: quick-chat, consultation, code-review
```

The seed creates one user, three event types, a Mon-Fri 9:00-18:00 IST default
schedule, one blocked date override, and sample bookings.

## Authentication

Register a user:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "password123",
    "timezone": "Asia/Kolkata"
  }'
```

Login for API/frontend clients:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "password": "password123"}'
```

Use the returned JWT:

```bash
curl http://127.0.0.1:8000/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Swagger Authorize

Swagger's green **Authorize** button uses OAuth2 password form fields, so this
backend exposes `/api/auth/token` for Swagger.

In Swagger UI, enter:

```text
username: john@example.com
password: password123
```

Leave `client_id` and `client_secret` empty. Even though the field is named
`username`, enter the user's email address.

## API Endpoints

All application endpoints are under `/api` unless noted.

### Root

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/` | Public | API welcome response with docs and health links |
| GET | `/health` | Public | Health check response |

### Auth

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Creates a user, creates a default working-hours schedule, and returns a JWT |
| POST | `/api/auth/login` | Public | JSON login with `email` and `password`; returns a JWT |
| POST | `/api/auth/token` | Public | OAuth2 form login for Swagger Authorize; put email in the `username` field |

### Users

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Returns the authenticated user's profile |
| PATCH | `/api/users/me` | Bearer | Updates name, bio, timezone, or avatar URL |
| GET | `/api/users/{username}` | Public | Returns a public user profile by username |

### Event Types

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/event-types` | Bearer | Lists all event types owned by the authenticated user |
| POST | `/api/event-types` | Bearer | Creates an event type; slug must be unique per user |
| GET | `/api/event-types/{event_type_id}` | Bearer | Gets one owned event type |
| PATCH | `/api/event-types/{event_type_id}` | Bearer | Updates an owned event type |
| DELETE | `/api/event-types/{event_type_id}` | Bearer | Deletes an owned event type |
| GET | `/api/event-types/public/{username}` | Public | Lists active, non-hidden event types for a user |
| GET | `/api/event-types/public/{username}/{slug}` | Public | Gets one active public event type by username and slug |

### Availability

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/availability/schedules` | Bearer | Lists the authenticated user's schedules |
| POST | `/api/availability/schedules` | Bearer | Creates a schedule with optional weekly rules |
| GET | `/api/availability/schedules/{schedule_id}` | Bearer | Gets one owned schedule with rules and overrides |
| PUT | `/api/availability/schedules/{schedule_id}` | Bearer | Updates schedule metadata and optionally replaces all rules |
| DELETE | `/api/availability/schedules/{schedule_id}` | Bearer | Deletes an owned schedule |
| POST | `/api/availability/schedules/{schedule_id}/overrides` | Bearer | Adds or updates a date override for a schedule |
| DELETE | `/api/availability/schedules/{schedule_id}/overrides/{override_id}` | Bearer | Deletes a date override |
| GET | `/api/availability/slots/{username}/{slug}?date=YYYY-MM-DD` | Public | Returns bookable slots for a user's event type on one date |
| GET | `/api/availability/busy-dates/{username}/{slug}?year=YYYY&month=M` | Public | Returns dates in a month with no available slots |

### Bookings

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/bookings` | Public | Creates a guest booking for an event type |
| GET | `/api/bookings/token/{cancel_token}` | Public | Gets booking details using a public cancel token |
| POST | `/api/bookings/cancel/{cancel_token}` | Public | Cancels a guest booking using its cancel token |
| POST | `/api/bookings/reschedule/{reschedule_token}` | Public | Creates a new booking time and marks the old booking rescheduled |
| GET | `/api/bookings/admin` | Bearer | Lists authenticated user's bookings split into upcoming and past |
| GET | `/api/bookings/admin/{booking_id}` | Bearer | Gets one booking owned by the authenticated user |
| POST | `/api/bookings/admin/{booking_id}/cancel` | Bearer | Cancels a booking from the host dashboard |

Admin booking list supports these query filters:

```text
status=pending|confirmed|cancelled|rescheduled|completed
event_type_id=<id>
search=<guest name or email>
```

## Core Behavior

- Development startup runs `Base.metadata.create_all()` automatically.
- Times in bookings are stored as UTC-aware timestamps.
- Availability rules use local schedule time plus the schedule timezone.
- Public slot lookup applies working hours, date overrides, existing bookings,
  buffers, minimum booking notice, and maximum booking days.
- Booking creation checks for overlapping active bookings and returns `409` when
  the slot is no longer available.
- Guest cancel/reschedule flows use long public tokens, so guests do not need an
  account.
- Email notification failures are ignored so core booking flows continue.

## Project Structure

```text
backend/
├── main.py                  # FastAPI app entry point
├── auth.py                  # Register/login/token routes
├── users.py                 # User routes and current-user dependency
├── event_types.py           # Event type routes
├── bookings.py              # Booking routes
├── availability.py          # Availability SQLAlchemy models
├── booking_service.py       # Booking create/cancel/reschedule logic
├── availability_engine.py   # Slot and busy-date calculation
├── notification_service.py  # Optional SMTP emails
├── seed.py                  # Demo data
├── config.py                # pydantic-settings .env loader
├── database.py              # SQLAlchemy engine/session/Base
├── docker-compose.yml
├── Dockerfile
└── app/                     # Compatibility package used by imports
```

`app/...` mostly re-exports or wraps the root modules so imports like
`app.api.routes.auth`, `app.db.seed`, and `app.models.user` work correctly.
