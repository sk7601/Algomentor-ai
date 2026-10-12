from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileLinkRequest(BaseModel):
    codeforces_handle: str | None = Field(default=None, max_length=100)
    leetcode_username: str | None = Field(default=None, max_length=100)


class RatingHistoryItem(BaseModel):
    platform: str
    rating: int
    contest_name: str | None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class SubmissionItem(BaseModel):
    platform: str
    problem_slug: str
    problem_title: str
    difficulty: str
    topics: list[str]
    verdict: str
    submitted_at: datetime | None

    model_config = {"from_attributes": True}


class TopicScoreItem(BaseModel):
    topic: str
    strength_score: float
    weakness_score: float
    problems_solved: int
    problems_attempted: int

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: UUID
    codeforces_handle: str | None
    leetcode_username: str | None
    codeforces_rating: int | None
    leetcode_rating: int | None
    max_codeforces_rating: int | None
    max_leetcode_rating: int | None
    total_solved: int
    easy_solved: int
    medium_solved: int
    hard_solved: int
    contest_count: int
    last_synced_at: datetime | None

    model_config = {"from_attributes": True}


class ProfileSyncResponse(BaseModel):
    profile: ProfileResponse
    rating_history: list[RatingHistoryItem]
    topic_scores: list[TopicScoreItem]
    message: str
