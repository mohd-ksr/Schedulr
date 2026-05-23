from fastapi import APIRouter
from app.api.routes import users, event_types, availability, bookings

api_router = APIRouter(prefix="/api")

api_router.include_router(users.router)
api_router.include_router(event_types.router)
api_router.include_router(availability.router)
api_router.include_router(bookings.router)
