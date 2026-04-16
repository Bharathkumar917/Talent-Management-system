"""Application configuration via environment variables."""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ACME Team Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database — SQLite for local dev, PostgreSQL for production
    # For production: DATABASE_URL=postgresql://tms_user:password@host:5432/team_management
    DATABASE_URL: str = "sqlite:///./team_management.db"

    # JWT
    SECRET_KEY: str = "acme-tms-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        """Accept common deployment-style strings instead of crashing on import."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "1", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"false", "0", "no", "off", "release", "production", "prod"}:
                return False
        return value

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
