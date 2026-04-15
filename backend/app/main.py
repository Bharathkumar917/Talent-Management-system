"""ACME Team Management System — FastAPI Application."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.config import get_settings
from app.database import engine, Base
from app.utils.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.routers import auth, users, teams, members, achievements, analytics

settings = get_settings()


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Centralized Team Management System for ACME Inc.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Routers
    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(teams.router, prefix="/api")
    app.include_router(members.router, prefix="/api")
    app.include_router(achievements.router, prefix="/api")
    app.include_router(analytics.router, prefix="/api")

    @app.on_event("startup")
    def on_startup():
        """Create tables on startup (dev only — use Alembic in production)."""
        Base.metadata.create_all(bind=engine)

    @app.get("/api/health", tags=["Health"])
    def health_check():
        return {"status": "healthy", "service": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_app()
