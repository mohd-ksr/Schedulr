# Scheduling Platform

A Cal.com-style scheduling application with a FastAPI backend, PostgreSQL database, and Next.js frontend. Users can create event types, manage availability, share public booking links, accept guest bookings, and view bookings from an authenticated dashboard.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, Uvicorn
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Database: PostgreSQL via Docker Compose
- Auth: JWT bearer tokens

## Project Structure

```text
.
├── backend/              # FastAPI API, database models, services, Docker setup
├── frontend/             # Next.js app, dashboard pages, public booking pages
├── README.md             # Full project setup guide
└── .gitignore
```

## Prerequisites

- Python 3.12
- Node.js 20 or newer
- Docker Desktop
- npm

## Environment Setup

### Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5433/scheduling_db
APP_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:3000
```

Optional email settings can be added if you want booking emails:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@scheduling.com
```

### Frontend

Create `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Run Locally

### 1. Start PostgreSQL

```bash
cd backend
docker compose up -d db
```

PostgreSQL is available on host port `5433`.

### 2. Start Backend API

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

If the virtual environment does not exist yet:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URLs:

- API root: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

### 3. Seed Demo Data

```bash
cd backend
source venv/bin/activate
python -m app.db.seed
```

Demo login:

```text
email: john@example.com
password: password123
```

Demo public booking data:

```text
username: johndoe
event slugs: quick-chat, consultation, code-review
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

## Docker Compose

To run the backend and database together:

```bash
cd backend
docker compose up --build
```

Seed data inside the backend container:

```bash
docker compose exec backend python -m app.db.seed
```

## Main Features

- User registration and login
- JWT-protected dashboard
- Event type creation and management
- Availability schedule management
- Public profile and booking pages
- Bookable slot lookup
- Guest booking, cancellation, and rescheduling
- Host booking dashboard
- API documentation through Swagger and ReDoc

## Important Routes

Frontend pages include:

- `/login`
- `/register`
- `/event-types`
- `/availability`
- `/bookings`
- `/settings/profile`
- `/:username`
- `/:username/:slug`
- `/cancel/:token`

Backend endpoints are mounted under `/api`, with public health and docs routes at `/health`, `/docs`, and `/redoc`.

## Useful Commands

Backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
python -m app.db.seed
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Docker:

```bash
cd backend
docker compose up -d db
docker compose up --build
docker compose down
```

## Notes

- In development, the backend creates database tables automatically on startup.
- Use Alembic migrations for production schema changes.
- `.env` files are ignored by Git. Keep local secrets out of commits.
- More backend-specific API details are available in `backend/README.md`.
