"""TeamMember schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MemberCreate(BaseModel):
    user_id: uuid.UUID
    team_id: uuid.UUID
    role: str = Field(default="member", pattern="^(leader|member)$")
    is_direct_staff: bool = True


class MemberUpdate(BaseModel):
    role: Optional[str] = Field(None, pattern="^(leader|member)$")
    is_direct_staff: Optional[bool] = None


class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    team_id: uuid.UUID
    role: str
    is_direct_staff: bool
    joined_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    team_name: Optional[str] = None

    model_config = {"from_attributes": True}


class MemberListResponse(BaseModel):
    members: list[MemberResponse]
    total: int
