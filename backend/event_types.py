from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.event_type import EventType
from app.schemas.event_type import EventTypeCreate, EventTypeUpdate, EventTypeOut, EventTypePublic
from app.api.routes.users import get_current_user

router = APIRouter(prefix="/event-types", tags=["Event Types"])


# ── Admin routes (authenticated user) ───────────────────────────────────────

@router.get("", response_model=List[EventTypeOut])
def list_event_types(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all event types for the admin user."""
    return (
        db.query(EventType)
        .filter(EventType.user_id == user.id)
        .order_by(EventType.created_at.asc())
        .all()
    )


@router.post("", response_model=EventTypeOut, status_code=201)
def create_event_type(
    payload: EventTypeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new event type."""
    # Check slug uniqueness for this user
    existing = (
        db.query(EventType)
        .filter(EventType.user_id == user.id, EventType.slug == payload.slug)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{payload.slug}' is already taken")

    event_type = EventType(user_id=user.id, **payload.model_dump())
    db.add(event_type)
    db.commit()
    db.refresh(event_type)
    return event_type


@router.get("/{event_type_id}", response_model=EventTypeOut)
def get_event_type(
    event_type_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a specific event type (admin)."""
    et = (
        db.query(EventType)
        .filter(EventType.id == event_type_id, EventType.user_id == user.id)
        .first()
    )
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    return et


@router.patch("/{event_type_id}", response_model=EventTypeOut)
def update_event_type(
    event_type_id: int,
    payload: EventTypeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update an event type."""
    et = (
        db.query(EventType)
        .filter(EventType.id == event_type_id, EventType.user_id == user.id)
        .first()
    )
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(et, field, value)

    db.commit()
    db.refresh(et)
    return et


@router.delete("/{event_type_id}", status_code=204)
def delete_event_type(
    event_type_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete an event type (and all its bookings via cascade)."""
    et = (
        db.query(EventType)
        .filter(EventType.id == event_type_id, EventType.user_id == user.id)
        .first()
    )
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    db.delete(et)
    db.commit()


# ── Public routes ────────────────────────────────────────────────────────────

@router.get("/public/{username}", response_model=List[EventTypePublic])
def list_public_event_types(username: str, db: Session = Depends(get_db)):
    """
    Returns all active, non-hidden event types for a user.
    Used on the public profile page (/<username>).
    """
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return (
        db.query(EventType)
        .filter(
            EventType.user_id == user.id,
            EventType.is_active == True,
            EventType.is_hidden == False,
        )
        .all()
    )


@router.get("/public/{username}/{slug}", response_model=EventTypePublic)
def get_public_event_type(username: str, slug: str, db: Session = Depends(get_db)):
    """
    Returns a specific event type by username + slug.
    Used on the public booking page (/<username>/<slug>).
    """
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    et = (
        db.query(EventType)
        .filter(
            EventType.user_id == user.id,
            EventType.slug == slug,
            EventType.is_active == True,
        )
        .first()
    )
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    return et
