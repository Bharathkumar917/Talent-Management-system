"""Achievement schemas."""
import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class AchievementCreate(BaseModel):
    team_id: uuid.UUID
    month: date
    description: str = Field(..., min_length=1, max_length=2000)
    metrics: dict = Field(default_factory=dict)


class AchievementUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    metrics: Optional[dict] = None
    month: Optional[date] = None


class AchievementResponse(BaseModel):
    id: uuid.UUID
    team_id: uuid.UUID
    month: date
    description: str
    metrics: dict
    created_at: datetime
    updated_at: datetime
    team_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AchievementListResponse(BaseModel):
    achievements: list[AchievementResponse]
    total: int
    page: int
    page_size: int
