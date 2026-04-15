"""Analytics routes — business insights endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import (
    TeamInsightsResponse, RatiosResponse, LeadershipResponse, DashboardStats
)
from app.services import analytics_service
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/team-insights", response_model=TeamInsightsResponse)
def team_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get team composition insights — members, locations, sizes."""
    return analytics_service.get_team_insights(db)


@router.get("/ratios", response_model=RatiosResponse)
def staff_ratios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get direct vs non-direct staff ratios per team. Flags teams >20% non-direct."""
    return analytics_service.get_staff_ratios(db)


@router.get("/leadership", response_model=LeadershipResponse)
def leadership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Leadership analysis: co-location, direct staff, org hierarchy."""
    return analytics_service.get_leadership_insights(db)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated dashboard stats."""
    return analytics_service.get_dashboard_stats(db)
