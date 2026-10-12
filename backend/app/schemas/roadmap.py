from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RoadmapGenerateRequest(BaseModel):
    duration_weeks: int = Field(ge=4, le=12)
    target_rating: int = Field(ge=800, le=3500)


class WeekPlan(BaseModel):
    week: int
    focus_topics: list[str]
    problems: list[str]
    goals: list[str]
    estimated_hours: int


class RoadmapResponse(BaseModel):
    id: UUID
    duration_weeks: int
    target_rating: int
    current_rating: int
    weak_topics: list[str]
    plan: dict
    created_at: datetime

    model_config = {"from_attributes": True}
