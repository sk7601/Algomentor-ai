from collections import defaultdict
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.schemas.analytics import (
    DashboardResponse,
    DashboardStats,
    RatingChartPoint,
    TopicRadarPoint,
    WeaknessHeatmapCell,
)
from app.services.topic_constants import TOPICS


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileRepository(db)

    async def get_dashboard(self, user: User) -> DashboardResponse:
        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not linked. Connect Codeforces or LeetCode first.",
            )

        submissions = await self.profiles.get_submissions(profile.id)
        rating_history = await self.profiles.get_rating_history(profile.id)
        topic_scores = await self.profiles.get_topic_scores(profile.id)

        consistency = self._compute_consistency(rating_history)

        stats = DashboardStats(
            total_solved=profile.total_solved,
            easy_solved=profile.easy_solved,
            medium_solved=profile.medium_solved,
            hard_solved=profile.hard_solved,
            codeforces_rating=profile.codeforces_rating,
            leetcode_rating=profile.leetcode_rating,
            contest_count=profile.contest_count,
            consistency_score=consistency,
        )

        rating_chart = self._build_rating_chart(rating_history)
        topic_radar = [
            TopicRadarPoint(
                topic=t.topic,
                strength=t.strength_score,
                weakness=t.weakness_score,
            )
            for t in topic_scores
        ] or [TopicRadarPoint(topic=topic, strength=0, weakness=100) for topic in TOPICS]

        weakness_heatmap = self._build_heatmap(submissions, topic_scores)

        return DashboardResponse(
            stats=stats,
            rating_chart=rating_chart,
            topic_radar=topic_radar,
            weakness_heatmap=weakness_heatmap,
        )

    def _compute_consistency(self, rating_history: list) -> float:
        if len(rating_history) < 2:
            return 50.0
        changes = []
        for i in range(1, len(rating_history)):
            changes.append(abs(rating_history[i].rating - rating_history[i - 1].rating))
        avg_change = sum(changes) / len(changes)
        return round(max(0.0, min(100.0, 100 - avg_change / 5)), 2)

    def _build_rating_chart(self, rating_history: list) -> list[RatingChartPoint]:
        by_date: dict[str, dict] = defaultdict(lambda: {"codeforces": None, "leetcode": None})
        for entry in rating_history:
            date_key = entry.recorded_at.date().isoformat()
            by_date[date_key][entry.platform] = entry.rating

        return [
            RatingChartPoint(
                date=date,
                codeforces=values["codeforces"],
                leetcode=values["leetcode"],
            )
            for date, values in sorted(by_date.items(), key=lambda x: x[0])
        ]

    def _build_heatmap(self, submissions: list, topic_scores: list) -> list[WeaknessHeatmapCell]:
        topic_weakness = {t.topic: t.weakness_score for t in topic_scores}
        difficulty_gaps: dict[tuple[str, str], list[float]] = defaultdict(list)

        for sub in submissions:
            for topic in sub.topics:
                base_weakness = topic_weakness.get(topic, 50.0)
                if sub.difficulty == "easy":
                    gap = base_weakness * 0.5
                elif sub.difficulty == "medium":
                    gap = base_weakness * 0.75
                else:
                    gap = base_weakness
                difficulty_gaps[(topic, sub.difficulty)].append(gap)

        cells = []
        for topic in TOPICS:
            for difficulty in ["easy", "medium", "hard"]:
                gaps = difficulty_gaps.get((topic, difficulty), [topic_weakness.get(topic, 50.0)])
                cells.append(
                    WeaknessHeatmapCell(
                        topic=topic,
                        difficulty=difficulty,
                        gap_score=round(sum(gaps) / len(gaps), 2),
                    )
                )
        return cells
