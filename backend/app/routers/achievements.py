"""Achievement routes."""
import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.achievement import (
    AchievementCreate, AchievementUpdate, AchievementResponse, AchievementListResponse
)
from app.services import achievement_service
from app.middleware.auth import get_current_user, require_contributor, require_manager
from app.models.user import User

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("", response_model=AchievementListResponse)
def list_achievements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    team_id: Optional[uuid.UUID] = None,
    month: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List achievements with optional team/month filter."""
    return achievement_service.get_achievements(db, page, page_size, team_id, month)


@router.get("/{achievement_id}", response_model=AchievementResponse)
def get_achievement(
    achievement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single achievement."""
    return achievement_service.get_achievement_by_id(db, achievement_id)


@router.post("", response_model=AchievementResponse, status_code=201)
def create_achievement(
    data: AchievementCreate,
    current_user: User = Depends(require_contributor),
    db: Session = Depends(get_db),
):
    """Create a new achievement."""
    return achievement_service.create_achievement(db, data)


@router.put("/{achievement_id}", response_model=AchievementResponse)
def update_achievement(
    achievement_id: uuid.UUID,
    data: AchievementUpdate,
    current_user: User = Depends(require_contributor),
    db: Session = Depends(get_db),
):
    """Update an achievement."""
    return achievement_service.update_achievement(db, achievement_id, data)


@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: uuid.UUID,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Delete an achievement (admin/manager only)."""
    return achievement_service.delete_achievement(db, achievement_id)
