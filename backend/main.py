"""
Main Application Entry Point
=============================
FastAPI app with:
- CORS for frontend communication
- All routers mounted under /api
- Health check endpoint
- Auto-create tables on startup (dev mode)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import inspect, text

from app.core.config import settings
from app.api import api_router
from app.db.database import engine, Base
import app.models  # noqa — ensures all models are registered with Base


def ensure_dev_schema_updates():
    """Apply tiny dev-only schema patches that create_all cannot handle."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "hashed_password" not in user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))

    with engine.begin() as conn:
        from app.core.security import get_password_hash

        conn.execute(
            text(
                """
                UPDATE users
                SET hashed_password = :hashed_password
                WHERE email = 'john@example.com'
                  AND hashed_password IS NULL
                """
            ),
            {"hashed_password": get_password_hash("password123")},
        )
        conn.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('users', 'id'),
                    COALESCE((SELECT MAX(id) FROM users), 1),
                    true
                )
                """
            )
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before serving requests."""
    # Auto-create tables in development. In production, use Alembic migrations.
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)
        ensure_dev_schema_updates()
        print("✅ Database tables created (dev mode)")
    yield
    # Shutdown tasks (if any) go here


app = FastAPI(
    title="Scheduling Platform API",
    description="Cal.com-like scheduling backend built with FastAPI + PostgreSQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Scheduling Platform API",
        "docs": "/docs",
        "health": "/health",
    }
