from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    total_solved: int
    easy_solved: int
    medium_solved: int
    hard_solved: int
    codeforces_rating: int | None
    leetcode_rating: int | None
    contest_count: int
    consistency_score: float


class RatingChartPoint(BaseModel):
    date: str
    codeforces: int | None
    leetcode: int | None


class TopicRadarPoint(BaseModel):
    topic: str
    strength: float
    weakness: float


class WeaknessHeatmapCell(BaseModel):
    topic: str
    difficulty: str
    gap_score: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    rating_chart: list[RatingChartPoint]
    topic_radar: list[TopicRadarPoint]
    weakness_heatmap: list[WeaknessHeatmapCell]
