from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.database import get_db
from app.models.availability import AvailabilityRule, AvailabilitySchedule
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])


def _create_default_schedule(db: Session, user: User) -> None:
    schedule = AvailabilitySchedule(
        user_id=user.id,
        name="Working Hours",
        timezone=user.timezone,
        is_default=True,
    )
    db.add(schedule)
    db.flush()

    for day in range(7):
        is_working_day = day < 5
        db.add(
            AvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=day,
                is_available=is_working_day,
                start_time=time(9, 0) if is_working_day else None,
                end_time=time(18, 0) if is_working_day else None,
            )
        )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(User)
        .filter(or_(User.email == payload.email, User.username == payload.username))
        .first()
    )
    if existing:
        detail = "Email is already registered"
        if existing.username == payload.username:
            detail = "Username is already taken"
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)

    user = User(
        name=payload.name,
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        bio=payload.bio,
        timezone=payload.timezone,
        avatar_url=payload.avatar_url,
        is_active=True,
    )
    db.add(user)
    db.flush()
    _create_default_schedule(db, user)
    db.commit()
    db.refresh(user)

    return Token(access_token=create_access_token(user.id), user=user)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return _authenticate_user(payload.email, payload.password, db)


@router.post("/token", response_model=Token)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return _authenticate_user(form_data.username, form_data.password, db)


def _authenticate_user(email: str, password: str, db: Session) -> Token:
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(access_token=create_access_token(user.id), user=user)
