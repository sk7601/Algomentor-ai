from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CodeReviewRequest(BaseModel):
    source_code: str = Field(min_length=10, max_length=50000)
    language: str = Field(default="python", max_length=50)
    problem_title: str | None = Field(default=None, max_length=255)


class CodeReviewAnalysis(BaseModel):
    time_complexity: str
    space_complexity: str
    bugs: list[str]
    edge_cases: list[str]
    better_approaches: list[str]
    optimized_solution: str
    overall_score: int
    summary: str


class CodeReviewResponse(BaseModel):
    id: UUID
    problem_title: str | None
    language: str
    analysis: CodeReviewAnalysis
    created_at: datetime

    model_config = {"from_attributes": True}
