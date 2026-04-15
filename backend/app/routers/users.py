"""User CRUD routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserUpdate, UserResponse, UserListResponse
from app.services import user_service
from app.middleware.auth import get_current_user, require_admin, require_manager
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """List all users (admin/manager only)."""
    return user_service.get_users(db, page, page_size, search, role)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a user by ID."""
    return user_service.get_user_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a user. Admins update anyone, users update self only."""
    return user_service.update_user(db, user_id, data, current_user)


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Deactivate a user (admin only)."""
    return user_service.delete_user(db, user_id)
