"""Analytics API tests — ensures all 7 business insights are computable."""
import pytest
from datetime import date
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.models.achievement import Achievement
from app.utils.security import hash_password


def setup_analytics_data(db_session):
    """Create a rich dataset for analytics tests."""
    pw = hash_password("Test123!")

    # Users
    org_leader = User(name="CEO", email="ceo@acme.com", password_hash=pw, role="admin")
    leader1 = User(name="Eng Lead", email="eng-lead@acme.com", password_hash=pw, role="manager")
    leader2 = User(name="Remote Lead", email="remote-lead@acme.com", password_hash=pw, role="manager")
    member1 = User(name="Dev 1", email="dev1@acme.com", password_hash=pw, role="contributor")
    member2 = User(name="Dev 2", email="dev2@acme.com", password_hash=pw, role="contributor")
    contractor = User(name="Contractor", email="contractor@acme.com", password_hash=pw, role="contributor")

    db_session.add_all([org_leader, leader1, leader2, member1, member2, contractor])
    db_session.flush()

    # Team 1: Leader co-located, all direct, reports to org leader
    team1 = Team(name="Engineering", location="SF", leader_id=leader1.id, org_leader_id=org_leader.id)
    # Team 2: Leader NOT co-located (remote), has non-direct staff >20%, reports to org leader
    team2 = Team(name="Marketing", location="NY", leader_id=leader2.id, org_leader_id=org_leader.id)
    # Team 3: No org leader
    team3 = Team(name="Research", location="Boston", leader_id=member1.id, org_leader_id=None)

    db_session.add_all([team1, team2, team3])
    db_session.flush()

    # Members
    # Team 1: leader is co-located (member of team), all direct
    m1 = TeamMember(user_id=leader1.id, team_id=team1.id, role="leader", is_direct_staff=True)
    m2 = TeamMember(user_id=member1.id, team_id=team1.id, role="member", is_direct_staff=True)
    m3 = TeamMember(user_id=member2.id, team_id=team1.id, role="member", is_direct_staff=True)

    # Team 2: leader NOT in team members (not co-located), 50% non-direct
    m4 = TeamMember(user_id=member1.id, team_id=team2.id, role="member", is_direct_staff=True)
    m5 = TeamMember(user_id=contractor.id, team_id=team2.id, role="member", is_direct_staff=False)

    # Team 3: leader is in team
    m6 = TeamMember(user_id=member1.id, team_id=team3.id, role="leader", is_direct_staff=True)

    db_session.add_all([m1, m2, m3, m4, m5, m6])

    # Achievements
    a1 = Achievement(team_id=team1.id, month=date(2024, 1, 1),
                     description="Shipped v2.0", metrics={"uptime": 99.9})
    db_session.add(a1)

    db_session.commit()
    return org_leader


class TestTeamInsights:
    def test_team_insights(self, client, db_session):
        user = setup_analytics_data(db_session)
        from app.utils.security import create_access_token
        token = create_access_token({"sub": str(user.id), "role": "admin"})

        res = client.get("/api/analytics/team-insights",
                         headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert len(data["insights"]) == 3

        # Find Engineering team
        eng = next(i for i in data["insights"] if i["team_name"] == "Engineering")
        assert eng["member_count"] == 3
        assert eng["direct_staff_count"] == 3
        assert eng["location"] == "SF"


class TestRatios:
    def test_staff_ratios(self, client, db_session):
        user = setup_analytics_data(db_session)
        from app.utils.security import create_access_token
        token = create_access_token({"sub": str(user.id), "role": "admin"})

        res = client.get("/api/analytics/ratios",
                         headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()

        # Marketing has 50% non-direct, should exceed 20%
        mkt = next(r for r in data["ratios"] if r["team_name"] == "Marketing")
        assert mkt["non_direct_ratio"] == 50.0
        assert mkt["exceeds_threshold"] is True
        assert data["teams_exceeding_threshold"] >= 1

        # Engineering is all direct
        eng = next(r for r in data["ratios"] if r["team_name"] == "Engineering")
        assert eng["non_direct_ratio"] == 0.0
        assert eng["exceeds_threshold"] is False


class TestLeadership:
    def test_leadership_insights(self, client, db_session):
        user = setup_analytics_data(db_session)
        from app.utils.security import create_access_token
        token = create_access_token({"sub": str(user.id), "role": "admin"})

        res = client.get("/api/analytics/leadership",
                         headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()

        # Engineering: leader is co-located (in members), direct staff
        eng = next(i for i in data["insights"] if i["team_name"] == "Engineering")
        assert eng["leader_is_colocated"] is True
        assert eng["leader_is_direct_staff"] is True
        assert eng["reports_to_org_leader"] is True

        # Marketing: leader NOT co-located (not in members)
        mkt = next(i for i in data["insights"] if i["team_name"] == "Marketing")
        assert mkt["leader_is_colocated"] is False

        # Research: no org leader
        res_team = next(i for i in data["insights"] if i["team_name"] == "Research")
        assert res_team["reports_to_org_leader"] is False

        # Summary counts
        assert data["non_colocated_leaders"] >= 1
        assert data["teams_reporting_to_org_leader"] == 2


class TestDashboard:
    def test_dashboard_stats(self, client, db_session):
        user = setup_analytics_data(db_session)
        from app.utils.security import create_access_token
        token = create_access_token({"sub": str(user.id), "role": "admin"})

        res = client.get("/api/analytics/dashboard",
                         headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()

        assert data["total_teams"] == 3
        assert data["total_users"] >= 6
        assert data["total_achievements"] >= 1
        assert data["active_locations"] >= 2
        assert "teams_by_location" in data
        assert "staff_ratio_overview" in data
