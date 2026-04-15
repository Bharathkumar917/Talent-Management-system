"""User service — CRUD operations."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse, UserListResponse
from app.utils.exceptions import NotFoundException, ConflictException


def get_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
) -> UserListResponse:
    """List users with pagination, search, and filter."""
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_user_by_id(db: Session, user_id: uuid.UUID) -> UserResponse:
    """Get a single user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")
    return UserResponse.model_validate(user)


def update_user(db: Session, user_id: uuid.UUID, data: UserUpdate, current_user: User) -> UserResponse:
    """Update a user. Admins can update anyone, users can update themselves (except role)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")

    # Non-admins can only update their own profile
    if current_user.role != "admin" and current_user.id != user_id:
        from app.utils.exceptions import ForbiddenException
        raise ForbiddenException("You can only update your own profile")

    # Non-admins can't change roles
    if data.role is not None and current_user.role != "admin":
        from app.utils.exceptions import ForbiddenException
        raise ForbiddenException("Only admins can change roles")

    # Check email uniqueness if changing
    if data.email and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise ConflictException("Email already in use")

    # Apply updates
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def delete_user(db: Session, user_id: uuid.UUID) -> dict:
    """Deactivate a user (soft delete)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")

    user.is_active = False
    db.commit()
    return {"message": "User deactivated successfully"}
