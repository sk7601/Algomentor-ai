from pydantic import BaseModel


class ProblemRecommendation(BaseModel):
    platform: str
    slug: str
    title: str
    difficulty: str
    topics: list[str]
    rating: int | None
    url: str | None
    success_probability: float
    reason: str


class RecommendationsResponse(BaseModel):
    easy: list[ProblemRecommendation]
    medium: list[ProblemRecommendation]
    hard: list[ProblemRecommendation]


class RatingPrediction(BaseModel):
    next_contest_rating: int
    three_month_rating: int
    six_month_rating: int
    confidence: float
    factors: dict[str, float]


class InterviewReadiness(BaseModel):
    amazon: int
    google: int
    microsoft: int
    atlassian: int
    overall: int
    breakdown: dict[str, dict[str, float]]
