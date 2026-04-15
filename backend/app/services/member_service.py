"""Member service — CRUD operations for team memberships."""
import uuid
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.team_member import TeamMember
from app.models.user import User
from app.models.team import Team
from app.schemas.team_member import MemberCreate, MemberUpdate, MemberResponse, MemberListResponse
from app.utils.exceptions import NotFoundException, ConflictException


def get_members(
    db: Session,
    team_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
) -> MemberListResponse:
    """List members, optionally filtered by team or user."""
    query = db.query(TeamMember).options(
        joinedload(TeamMember.user),
        joinedload(TeamMember.team),
    )

    if team_id:
        query = query.filter(TeamMember.team_id == team_id)
    if user_id:
        query = query.filter(TeamMember.user_id == user_id)

    members = query.all()
    result = []
    for m in members:
        result.append(MemberResponse(
            id=m.id,
            user_id=m.user_id,
            team_id=m.team_id,
            role=m.role,
            is_direct_staff=m.is_direct_staff,
            joined_at=m.joined_at,
            user_name=m.user.name if m.user else None,
            user_email=m.user.email if m.user else None,
            team_name=m.team.name if m.team else None,
        ))

    return MemberListResponse(members=result, total=len(result))


def create_member(db: Session, data: MemberCreate) -> MemberResponse:
    """Add a member to a team."""
    # Validate user and team exist
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise NotFoundException("User")

    team = db.query(Team).filter(Team.id == data.team_id).first()
    if not team:
        raise NotFoundException("Team")

    # Check no duplicate membership
    existing = (
        db.query(TeamMember)
        .filter(TeamMember.user_id == data.user_id, TeamMember.team_id == data.team_id)
        .first()
    )
    if existing:
        raise ConflictException("User is already a member of this team")

    member = TeamMember(
        user_id=data.user_id,
        team_id=data.team_id,
        role=data.role,
        is_direct_staff=data.is_direct_staff,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return MemberResponse(
        id=member.id,
        user_id=member.user_id,
        team_id=member.team_id,
        role=member.role,
        is_direct_staff=member.is_direct_staff,
        joined_at=member.joined_at,
        user_name=user.name,
        user_email=user.email,
        team_name=team.name,
    )


def update_member(db: Session, member_id: uuid.UUID, data: MemberUpdate) -> MemberResponse:
    """Update a team membership."""
    member = (
        db.query(TeamMember)
        .options(joinedload(TeamMember.user), joinedload(TeamMember.team))
        .filter(TeamMember.id == member_id)
        .first()
    )
    if not member:
        raise NotFoundException("Team member")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)

    return MemberResponse(
        id=member.id,
        user_id=member.user_id,
        team_id=member.team_id,
        role=member.role,
        is_direct_staff=member.is_direct_staff,
        joined_at=member.joined_at,
        user_name=member.user.name if member.user else None,
        user_email=member.user.email if member.user else None,
        team_name=member.team.name if member.team else None,
    )


def delete_member(db: Session, member_id: uuid.UUID) -> dict:
    """Remove a member from a team."""
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise NotFoundException("Team member")

    db.delete(member)
    db.commit()
    return {"message": "Member removed from team successfully"}
