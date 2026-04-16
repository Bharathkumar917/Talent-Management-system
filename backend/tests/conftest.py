"""Shared test fixtures and configuration."""
import pytest
import uuid
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_app
from app.database import Base, get_db
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.achievement import Achievement
from app.utils.security import hash_password, create_access_token

# Test database — in-memory SQLite
TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Test client with overridden DB dependency."""
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    """Create an admin user."""
    user = User(
        name="Admin User", email="admin@test.com",
        password_hash=hash_password("TestPassword123"),
        role="admin",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_user(db_session):
    """Create a manager user."""
    user = User(
        name="Manager User", email="manager@test.com",
        password_hash=hash_password("TestPassword123"),
        role="manager",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def viewer_user(db_session):
    """Create a viewer user."""
    user = User(
        name="Viewer User", email="viewer@test.com",
        password_hash=hash_password("TestPassword123"),
        role="viewer",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def contributor_user(db_session):
    """Create a contributor user."""
    user = User(
        name="Contributor User", email="contributor@test.com",
        password_hash=hash_password("TestPassword123"),
        role="contributor",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """JWT token for admin."""
    return create_access_token({"sub": str(admin_user.id), "role": "admin"})


@pytest.fixture
def manager_token(manager_user):
    """JWT token for manager."""
    return create_access_token({"sub": str(manager_user.id), "role": "manager"})


@pytest.fixture
def viewer_token(viewer_user):
    """JWT token for viewer."""
    return create_access_token({"sub": str(viewer_user.id), "role": "viewer"})


@pytest.fixture
def contributor_token(contributor_user):
    """JWT token for contributor."""
    return create_access_token({"sub": str(contributor_user.id), "role": "contributor"})


@pytest.fixture
def auth_headers(admin_token):
    """Auth headers for admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_team(db_session, admin_user):
    """Create a sample team."""
    team = Team(
        name="Engineering", location="San Francisco",
        leader_id=admin_user.id, org_leader_id=admin_user.id,
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    return team


@pytest.fixture
def sample_member(db_session, admin_user, sample_team):
    """Create a sample team member."""
    member = TeamMember(
        user_id=admin_user.id, team_id=sample_team.id,
        role="leader", is_direct_staff=True,
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)
    return member


@pytest.fixture
def sample_achievement(db_session, sample_team):
    """Create a sample achievement."""
    achievement = Achievement(
        team_id=sample_team.id, month=date(2024, 1, 1),
        description="Launched v2.0", metrics={"uptime": 99.9},
    )
    db_session.add(achievement)
    db_session.commit()
    db_session.refresh(achievement)
    return achievement
