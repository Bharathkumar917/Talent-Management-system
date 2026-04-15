"""Analytics schemas."""
from typing import Optional
from pydantic import BaseModel


class TeamInsight(BaseModel):
    team_id: str
    team_name: str
    location: str
    member_count: int
    direct_staff_count: int
    non_direct_staff_count: int
    leader_name: Optional[str] = None
    org_leader_name: Optional[str] = None


class TeamRatio(BaseModel):
    team_id: str
    team_name: str
    total_members: int
    direct_staff: int
    non_direct_staff: int
    non_direct_ratio: float
    exceeds_threshold: bool  # > 20%


class LeadershipInsight(BaseModel):
    team_id: str
    team_name: str
    leader_name: Optional[str] = None
    team_location: str
    leader_is_colocated: bool
    leader_is_direct_staff: bool
    reports_to_org_leader: bool


class DashboardStats(BaseModel):
    total_teams: int
    total_users: int
    total_achievements: int
    active_locations: int
    teams_by_location: dict
    recent_achievements: list[dict]
    staff_ratio_overview: dict


class TeamInsightsResponse(BaseModel):
    insights: list[TeamInsight]


class RatiosResponse(BaseModel):
    ratios: list[TeamRatio]
    teams_exceeding_threshold: int


class LeadershipResponse(BaseModel):
    insights: list[LeadershipInsight]
    non_colocated_leaders: int
    non_direct_staff_leaders: int
    teams_reporting_to_org_leader: int
