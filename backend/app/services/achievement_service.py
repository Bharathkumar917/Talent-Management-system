"""Achievement service — CRUD operations."""
import uuid
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session, joinedload
from app.models.achievement import Achievement
from app.models.team import Team
from app.schemas.achievement import (
    AchievementCreate, AchievementUpdate, AchievementResponse, AchievementListResponse
)
from app.utils.exceptions import NotFoundException


def get_achievements(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    team_id: Optional[uuid.UUID] = None,
    month: Optional[date] = None,
) -> AchievementListResponse:
    """List achievements with filters."""
    query = db.query(Achievement).options(joinedload(Achievement.team))

    if team_id:
        query = query.filter(Achievement.team_id == team_id)
    if month:
        query = query.filter(Achievement.month == month)

    total = query.count()
    achievements = (
        query.order_by(Achievement.month.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for a in achievements:
        result.append(AchievementResponse(
            id=a.id,
            team_id=a.team_id,
            month=a.month,
            description=a.description,
            metrics=a.metrics or {},
            created_at=a.created_at,
            updated_at=a.updated_at,
            team_name=a.team.name if a.team else None,
        ))

    return AchievementListResponse(
        achievements=result,
        total=total,
        page=page,
        page_size=page_size,
    )


def get_achievement_by_id(db: Session, achievement_id: uuid.UUID) -> AchievementResponse:
    """Get a single achievement."""
    a = (
        db.query(Achievement)
        .options(joinedload(Achievement.team))
        .filter(Achievement.id == achievement_id)
        .first()
    )
    if not a:
        raise NotFoundException("Achievement")

    return AchievementResponse(
        id=a.id,
        team_id=a.team_id,
        month=a.month,
        description=a.description,
        metrics=a.metrics or {},
        created_at=a.created_at,
        updated_at=a.updated_at,
        team_name=a.team.name if a.team else None,
    )


def create_achievement(db: Session, data: AchievementCreate) -> AchievementResponse:
    """Create a new achievement."""
    team = db.query(Team).filter(Team.id == data.team_id).first()
    if not team:
        raise NotFoundException("Team")

    achievement = Achievement(
        team_id=data.team_id,
        month=data.month,
        description=data.description,
        metrics=data.metrics,
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)

    return AchievementResponse(
        id=achievement.id,
        team_id=achievement.team_id,
        month=achievement.month,
        description=achievement.description,
        metrics=achievement.metrics or {},
        created_at=achievement.created_at,
        updated_at=achievement.updated_at,
        team_name=team.name,
    )


def update_achievement(
    db: Session, achievement_id: uuid.UUID, data: AchievementUpdate
) -> AchievementResponse:
    """Update an achievement."""
    achievement = (
        db.query(Achievement)
        .options(joinedload(Achievement.team))
        .filter(Achievement.id == achievement_id)
        .first()
    )
    if not achievement:
        raise NotFoundException("Achievement")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(achievement, field, value)

    db.commit()
    db.refresh(achievement)

    return AchievementResponse(
        id=achievement.id,
        team_id=achievement.team_id,
        month=achievement.month,
        description=achievement.description,
        metrics=achievement.metrics or {},
        created_at=achievement.created_at,
        updated_at=achievement.updated_at,
        team_name=achievement.team.name if achievement.team else None,
    )


def delete_achievement(db: Session, achievement_id: uuid.UUID) -> dict:
    """Delete an achievement."""
    achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not achievement:
        raise NotFoundException("Achievement")

    db.delete(achievement)
    db.commit()
    return {"message": "Achievement deleted successfully"}
