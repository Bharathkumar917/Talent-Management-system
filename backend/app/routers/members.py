"""Member management routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.team_member import MemberCreate, MemberUpdate, MemberResponse, MemberListResponse
from app.services import member_service
from app.middleware.auth import require_contributor, require_manager
from app.models.user import User

router = APIRouter(prefix="/members", tags=["Team Members"])


@router.get("", response_model=MemberListResponse)
def list_members(
    team_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_contributor),
    db: Session = Depends(get_db),
):
    """List member assignments, optionally filtered by team or user."""
    return member_service.get_members(db, team_id, user_id)


@router.post("", response_model=MemberResponse, status_code=201)
def add_member(
    data: MemberCreate,
    current_user: User = Depends(require_contributor),
    db: Session = Depends(get_db),
):
    """Add a user to a team."""
    return member_service.create_member(db, data)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: uuid.UUID,
    data: MemberUpdate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Update a member's role or staff status (admin/manager only)."""
    return member_service.update_member(db, member_id, data)


@router.delete("/{member_id}")
def remove_member(
    member_id: uuid.UUID,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Remove a member from a team (admin/manager only)."""
    return member_service.delete_member(db, member_id)
