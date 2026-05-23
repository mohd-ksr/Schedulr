from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@127.0.0.1:5433/scheduling_db"

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Demo seed user
    DEFAULT_USER_ID: int = 1
    DEFAULT_USER_NAME: str = "John Doe"
    DEFAULT_USER_EMAIL: str = "john@example.com"
    DEFAULT_USER_USERNAME: str = "johndoe"
    DEFAULT_USER_TIMEZONE: str = "Asia/Kolkata"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Email (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@scheduling.com"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
