"""Team service — CRUD operations."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse, TeamListResponse
from app.utils.exceptions import NotFoundException


def get_teams(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    location: Optional[str] = None,
    leader_id: Optional[uuid.UUID] = None,
) -> TeamListResponse:
    """List teams with pagination and filters."""
    query = db.query(Team)

    if search:
        query = query.filter(Team.name.ilike(f"%{search}%"))

    if location:
        query = query.filter(Team.location.ilike(f"%{location}%"))

    if leader_id:
        query = query.filter(Team.leader_id == leader_id)

    total = query.count()
    teams = query.order_by(Team.name).offset((page - 1) * page_size).limit(page_size).all()

    return TeamListResponse(
        teams=[TeamResponse.model_validate(t) for t in teams],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_team_by_id(db: Session, team_id: uuid.UUID) -> TeamDetailResponse:
    """Get detailed team info including members."""
    team = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.org_leader),
            joinedload(Team.members).joinedload(TeamMember.user),
        )
        .filter(Team.id == team_id)
        .first()
    )
    if not team:
        raise NotFoundException("Team")

    leader_info = None
    if team.leader:
        leader_info = {
            "id": str(team.leader.id),
            "name": team.leader.name,
            "email": team.leader.email,
        }

    org_leader_info = None
    if team.org_leader:
        org_leader_info = {
            "id": str(team.org_leader.id),
            "name": team.org_leader.name,
            "email": team.org_leader.email,
        }

    members_list = []
    for m in team.members:
        members_list.append({
            "id": str(m.id),
            "user_id": str(m.user_id),
            "name": m.user.name if m.user else "Unknown",
            "email": m.user.email if m.user else "",
            "role": m.role,
            "is_direct_staff": m.is_direct_staff,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        })

    return TeamDetailResponse(
        id=team.id,
        name=team.name,
        location=team.location,
        leader_id=team.leader_id,
        org_leader_id=team.org_leader_id,
        created_at=team.created_at,
        updated_at=team.updated_at,
        leader=leader_info,
        org_leader=org_leader_info,
        members=members_list,
        member_count=len(members_list),
    )


def create_team(db: Session, data: TeamCreate) -> TeamResponse:
    """Create a new team."""
    # Validate leader exists if provided
    if data.leader_id:
        leader = db.query(User).filter(User.id == data.leader_id).first()
        if not leader:
            raise NotFoundException("Leader user")

    if data.org_leader_id:
        org_leader = db.query(User).filter(User.id == data.org_leader_id).first()
        if not org_leader:
            raise NotFoundException("Org leader user")

    team = Team(
        name=data.name,
        location=data.location,
        leader_id=data.leader_id,
        org_leader_id=data.org_leader_id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return TeamResponse.model_validate(team)


def update_team(db: Session, team_id: uuid.UUID, data: TeamUpdate) -> TeamResponse:
    """Update a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise NotFoundException("Team")

    update_data = data.model_dump(exclude_unset=True)

    # Validate FK references
    if "leader_id" in update_data and update_data["leader_id"]:
        leader = db.query(User).filter(User.id == update_data["leader_id"]).first()
        if not leader:
            raise NotFoundException("Leader user")

    if "org_leader_id" in update_data and update_data["org_leader_id"]:
        org_leader = db.query(User).filter(User.id == update_data["org_leader_id"]).first()
        if not org_leader:
            raise NotFoundException("Org leader user")

    for field, value in update_data.items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)
    return TeamResponse.model_validate(team)


def delete_team(db: Session, team_id: uuid.UUID) -> dict:
    """Delete a team and cascade members/achievements."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise NotFoundException("Team")

    db.delete(team)
    db.commit()
    return {"message": "Team deleted successfully"}
