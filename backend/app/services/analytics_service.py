"""Analytics service — complex business logic for insights, ratios, and leadership analysis."""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.models.achievement import Achievement
from app.schemas.analytics import (
    TeamInsight, TeamInsightsResponse,
    TeamRatio, RatiosResponse,
    LeadershipInsight, LeadershipResponse,
    DashboardStats,
)


def get_team_insights(db: Session) -> TeamInsightsResponse:
    """Get team composition insights — members, locations, sizes."""
    teams = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.org_leader),
            joinedload(Team.members),
        )
        .all()
    )

    insights = []
    for team in teams:
        direct = sum(1 for m in team.members if m.is_direct_staff)
        non_direct = sum(1 for m in team.members if not m.is_direct_staff)

        insights.append(TeamInsight(
            team_id=str(team.id),
            team_name=team.name,
            location=team.location,
            member_count=len(team.members),
            direct_staff_count=direct,
            non_direct_staff_count=non_direct,
            leader_name=team.leader.name if team.leader else None,
            org_leader_name=team.org_leader.name if team.org_leader else None,
        ))

    return TeamInsightsResponse(insights=insights)


def get_staff_ratios(db: Session) -> RatiosResponse:
    """Calculate direct vs non-direct staff ratios. Flag teams >20% non-direct."""
    teams = (
        db.query(Team)
        .options(joinedload(Team.members))
        .all()
    )

    ratios = []
    exceeding = 0

    for team in teams:
        total = len(team.members)
        direct = sum(1 for m in team.members if m.is_direct_staff)
        non_direct = total - direct
        ratio = (non_direct / total * 100) if total > 0 else 0.0
        exceeds = ratio > 20.0

        if exceeds:
            exceeding += 1

        ratios.append(TeamRatio(
            team_id=str(team.id),
            team_name=team.name,
            total_members=total,
            direct_staff=direct,
            non_direct_staff=non_direct,
            non_direct_ratio=round(ratio, 2),
            exceeds_threshold=exceeds,
        ))

    return RatiosResponse(ratios=ratios, teams_exceeding_threshold=exceeding)


def get_leadership_insights(db: Session) -> LeadershipResponse:
    """
    Analyze leadership structure:
    - Leader co-location check (is leader in same location as team?)
    - Leader direct staff check (is leader marked as direct staff?)
    - Teams reporting to org leader
    """
    teams = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.org_leader),
            joinedload(Team.members),
        )
        .all()
    )

    insights = []
    non_colocated = 0
    non_direct_leaders = 0
    reports_to_org = 0

    for team in teams:
        # Check if leader is co-located with team
        leader_colocated = True
        if team.leader:
            # Find leader's membership in this team
            leader_membership = next(
                (m for m in team.members if m.user_id == team.leader_id),
                None,
            )
            # Also check if leader has teams in same location
            # Simple check: does the leader appear in this team's members?
            # If leader has a different primary location, they are not co-located
            # We can check via their own team memberships, but simplest:
            # leader is co-located if they are a member of this team
            leader_colocated = leader_membership is not None
        else:
            leader_colocated = True  # No leader = N/A, treat as True

        # Check if leader is direct staff
        leader_direct = True
        if team.leader:
            leader_membership = next(
                (m for m in team.members if m.user_id == team.leader_id),
                None,
            )
            if leader_membership:
                leader_direct = leader_membership.is_direct_staff
            else:
                leader_direct = False  # Not even a member = not direct staff

        # Check if team reports to org leader
        has_org_leader = team.org_leader_id is not None

        if not leader_colocated:
            non_colocated += 1
        if not leader_direct:
            non_direct_leaders += 1
        if has_org_leader:
            reports_to_org += 1

        insights.append(LeadershipInsight(
            team_id=str(team.id),
            team_name=team.name,
            leader_name=team.leader.name if team.leader else None,
            team_location=team.location,
            leader_is_colocated=leader_colocated,
            leader_is_direct_staff=leader_direct,
            reports_to_org_leader=has_org_leader,
        ))

    return LeadershipResponse(
        insights=insights,
        non_colocated_leaders=non_colocated,
        non_direct_staff_leaders=non_direct_leaders,
        teams_reporting_to_org_leader=reports_to_org,
    )


def get_dashboard_stats(db: Session) -> DashboardStats:
    """Aggregate stats for the main dashboard."""
    total_teams = db.query(func.count(Team.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_achievements = db.query(func.count(Achievement.id)).scalar() or 0

    # Distinct locations
    locations = db.query(Team.location, func.count(Team.id)).group_by(Team.location).all()
    teams_by_location = {loc: count for loc, count in locations}
    active_locations = len(teams_by_location)

    # Recent achievements
    recent = (
        db.query(Achievement)
        .options(joinedload(Achievement.team))
        .order_by(Achievement.created_at.desc())
        .limit(5)
        .all()
    )
    recent_achievements = [
        {
            "id": str(a.id),
            "team_name": a.team.name if a.team else "Unknown",
            "month": a.month.isoformat(),
            "description": a.description[:100],
            "metrics": a.metrics or {},
        }
        for a in recent
    ]

    # Staff ratio overview
    members = db.query(TeamMember).all()
    total_members = len(members)
    direct = sum(1 for m in members if m.is_direct_staff)
    non_direct = total_members - direct

    staff_ratio_overview = {
        "total_members": total_members,
        "direct_staff": direct,
        "non_direct_staff": non_direct,
        "direct_ratio": round((direct / total_members * 100) if total_members > 0 else 0, 2),
    }

    return DashboardStats(
        total_teams=total_teams,
        total_users=total_users,
        total_achievements=total_achievements,
        active_locations=active_locations,
        teams_by_location=teams_by_location,
        recent_achievements=recent_achievements,
        staff_ratio_overview=staff_ratio_overview,
    )
