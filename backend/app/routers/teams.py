"""Team CRUD routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse, TeamListResponse
from app.services import team_service
from app.middleware.auth import get_current_user, require_manager, require_admin
from app.models.user import User

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("", response_model=TeamListResponse)
def list_teams(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    location: Optional[str] = None,
    leader_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List teams with search and filter support."""
    return team_service.get_teams(db, page, page_size, search, location, leader_id)


@router.post("", response_model=TeamResponse, status_code=201)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Create a new team (admin/manager only)."""
    return team_service.create_team(db, data)


@router.get("/{team_id}", response_model=TeamDetailResponse)
def get_team(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get team details including members."""
    return team_service.get_team_by_id(db, team_id)


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: uuid.UUID,
    data: TeamUpdate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Update a team (admin/manager only)."""
    return team_service.update_team(db, team_id, data)


@router.delete("/{team_id}")
def delete_team(
    team_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a team (admin only)."""
    return team_service.delete_team(db, team_id)
