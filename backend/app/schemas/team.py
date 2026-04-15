"""Team schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=255)
    leader_id: Optional[uuid.UUID] = None
    org_leader_id: Optional[uuid.UUID] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    leader_id: Optional[uuid.UUID] = None
    org_leader_id: Optional[uuid.UUID] = None


class TeamResponse(BaseModel):
    id: uuid.UUID
    name: str
    location: str
    leader_id: Optional[uuid.UUID] = None
    org_leader_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeamDetailResponse(TeamResponse):
    leader: Optional[dict] = None
    org_leader: Optional[dict] = None
    members: list[dict] = []
    member_count: int = 0


class TeamListResponse(BaseModel):
    teams: list[TeamResponse]
    total: int
    page: int
    page_size: int
