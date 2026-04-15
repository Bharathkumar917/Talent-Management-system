"""Seed script — populate the database with realistic ACME Inc. data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.achievement import Achievement
from app.utils.security import hash_password


def seed():
    """Create tables and insert seed data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("🌱 Seeding database...")

        # ── Users ──
        password = hash_password("Password123!")

        admin = User(name="Sarah Chen", email="sarah.chen@acme.com", password_hash=password, role="admin")
        mgr1 = User(name="James Wilson", email="james.wilson@acme.com", password_hash=password, role="manager")
        mgr2 = User(name="Priya Sharma", email="priya.sharma@acme.com", password_hash=password, role="manager")
        mgr3 = User(name="Marcus Johnson", email="marcus.johnson@acme.com", password_hash=password, role="manager")
        contrib1 = User(name="Emily Davis", email="emily.davis@acme.com", password_hash=password, role="contributor")
        contrib2 = User(name="David Kim", email="david.kim@acme.com", password_hash=password, role="contributor")
        contrib3 = User(name="Lisa Wang", email="lisa.wang@acme.com", password_hash=password, role="contributor")
        contrib4 = User(name="Alex Thompson", email="alex.thompson@acme.com", password_hash=password, role="contributor")
        contrib5 = User(name="Rachel Green", email="rachel.green@acme.com", password_hash=password, role="contributor")
        contrib6 = User(name="Chris Martinez", email="chris.martinez@acme.com", password_hash=password, role="contributor")
        viewer1 = User(name="Tom Brown", email="tom.brown@acme.com", password_hash=password, role="viewer")
        viewer2 = User(name="Nina Patel", email="nina.patel@acme.com", password_hash=password, role="viewer")
        # Non-co-located leaders (for analytics)
        remote_mgr = User(name="Mike O'Brien", email="mike.obrien@acme.com", password_hash=password, role="manager")
        contractor1 = User(name="Sandra Lee", email="sandra.lee@acme.com", password_hash=password, role="contributor")
        contractor2 = User(name="Kevin Park", email="kevin.park@acme.com", password_hash=password, role="contributor")

        all_users = [admin, mgr1, mgr2, mgr3, contrib1, contrib2, contrib3, contrib4,
                     contrib5, contrib6, viewer1, viewer2, remote_mgr, contractor1, contractor2]
        db.add_all(all_users)
        db.flush()

        # ── Teams ──
        # Sarah Chen is the org leader
        eng_team = Team(name="Engineering", location="San Francisco", leader_id=mgr1.id, org_leader_id=admin.id)
        mkt_team = Team(name="Marketing", location="New York", leader_id=mgr2.id, org_leader_id=admin.id)
        sales_team = Team(name="Sales", location="Chicago", leader_id=mgr3.id, org_leader_id=admin.id)
        # Remote leader team — Mike leads from London but team is in San Francisco
        devops_team = Team(name="DevOps", location="San Francisco", leader_id=remote_mgr.id, org_leader_id=admin.id)
        # Team without org leader
        research_team = Team(name="Research", location="Boston", leader_id=contrib1.id, org_leader_id=None)

        all_teams = [eng_team, mkt_team, sales_team, devops_team, research_team]
        db.add_all(all_teams)
        db.flush()

        # ── Team Members ──
        members = [
            # Engineering (SF) — leader is co-located, all direct
            TeamMember(user_id=mgr1.id, team_id=eng_team.id, role="leader", is_direct_staff=True),
            TeamMember(user_id=contrib1.id, team_id=eng_team.id, role="member", is_direct_staff=True),
            TeamMember(user_id=contrib2.id, team_id=eng_team.id, role="member", is_direct_staff=True),
            TeamMember(user_id=contrib3.id, team_id=eng_team.id, role="member", is_direct_staff=True),

            # Marketing (NY) — leader co-located, has contractors (>20% non-direct)
            TeamMember(user_id=mgr2.id, team_id=mkt_team.id, role="leader", is_direct_staff=True),
            TeamMember(user_id=contrib4.id, team_id=mkt_team.id, role="member", is_direct_staff=True),
            TeamMember(user_id=contractor1.id, team_id=mkt_team.id, role="member", is_direct_staff=False),
            TeamMember(user_id=contractor2.id, team_id=mkt_team.id, role="member", is_direct_staff=False),

            # Sales (Chicago) — leader co-located
            TeamMember(user_id=mgr3.id, team_id=sales_team.id, role="leader", is_direct_staff=True),
            TeamMember(user_id=contrib5.id, team_id=sales_team.id, role="member", is_direct_staff=True),
            TeamMember(user_id=contrib6.id, team_id=sales_team.id, role="member", is_direct_staff=True),
            TeamMember(user_id=viewer1.id, team_id=sales_team.id, role="member", is_direct_staff=True),

            # DevOps (SF but leader is remote) — leader NOT co-located, leader NOT direct staff
            TeamMember(user_id=remote_mgr.id, team_id=devops_team.id, role="leader", is_direct_staff=False),
            TeamMember(user_id=viewer2.id, team_id=devops_team.id, role="member", is_direct_staff=True),

            # Research (Boston) — no org leader
            TeamMember(user_id=contrib1.id, team_id=research_team.id, role="leader", is_direct_staff=True),
        ]
        db.add_all(members)
        db.flush()

        # ── Achievements ──
        achievements = [
            Achievement(
                team_id=eng_team.id, month=date(2024, 1, 1),
                description="Launched v2.0 of the internal platform with 99.9% uptime",
                metrics={"uptime": 99.9, "deployments": 45, "bugs_fixed": 112},
            ),
            Achievement(
                team_id=eng_team.id, month=date(2024, 2, 1),
                description="Migrated to microservices architecture, reducing latency by 40%",
                metrics={"latency_reduction": 40, "services_deployed": 8},
            ),
            Achievement(
                team_id=eng_team.id, month=date(2024, 3, 1),
                description="Implemented CI/CD pipeline reducing deployment time from 2h to 15min",
                metrics={"deploy_time_minutes": 15, "pipeline_stages": 6},
            ),
            Achievement(
                team_id=mkt_team.id, month=date(2024, 1, 1),
                description="Q1 campaign generated 2,500 qualified leads",
                metrics={"leads": 2500, "conversion_rate": 3.2, "spend": 45000},
            ),
            Achievement(
                team_id=mkt_team.id, month=date(2024, 2, 1),
                description="Brand awareness increased 18% through social media strategy",
                metrics={"awareness_increase": 18, "followers_gained": 12000},
            ),
            Achievement(
                team_id=sales_team.id, month=date(2024, 1, 1),
                description="Closed $1.2M in new enterprise contracts",
                metrics={"revenue": 1200000, "deals_closed": 8, "avg_deal_size": 150000},
            ),
            Achievement(
                team_id=sales_team.id, month=date(2024, 3, 1),
                description="Expanded into APAC market with 3 new partnerships",
                metrics={"partnerships": 3, "pipeline_value": 800000},
            ),
            Achievement(
                team_id=devops_team.id, month=date(2024, 2, 1),
                description="Achieved SOC 2 Type II compliance ahead of schedule",
                metrics={"controls_implemented": 42, "audit_findings": 0},
            ),
            Achievement(
                team_id=research_team.id, month=date(2024, 1, 1),
                description="Published 3 papers on ML optimization techniques",
                metrics={"papers": 3, "citations": 89, "patents_filed": 1},
            ),
        ]
        db.add_all(achievements)

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   → {len(all_users)} users")
        print(f"   → {len(all_teams)} teams")
        print(f"   → {len(members)} team memberships")
        print(f"   → {len(achievements)} achievements")
        print(f"\n   Login: sarah.chen@acme.com / Password123!")
        print(f"   (All users share the same password)")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
