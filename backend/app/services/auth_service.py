"""Authentication service."""
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.exceptions import ConflictException, BadRequestException


def register_user(db: Session, user_data: UserCreate) -> TokenResponse:
    """Register a new user and return a JWT token."""
    # Check for existing email
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise ConflictException("A user with this email already exists")

    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def login_user(db: Session, email: str, password: str) -> TokenResponse:
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise BadRequestException("Invalid email or password")

    if not verify_password(password, user.password_hash):
        raise BadRequestException("Invalid email or password")

    if not user.is_active:
        raise BadRequestException("Account is deactivated")

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
