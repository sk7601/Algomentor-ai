from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.profile_repository import ProblemCatalogRepository, ProfileRepository
from app.schemas.predictions import ProblemRecommendation, RecommendationsResponse
from app.services.topic_analysis_service import TopicAnalysisService


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileRepository(db)
        self.catalog = ProblemCatalogRepository(db)
        self.topic_service = TopicAnalysisService()

    async def get_recommendations(self, user: User) -> RecommendationsResponse:
        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile required")

        topic_scores = await self.profiles.get_topic_scores(profile.id)
        topic_dicts = [{"topic": t.topic, "weakness_score": t.weakness_score} for t in topic_scores]
        weak_topics = set(self.topic_service.get_weak_topics(topic_dicts, limit=4))
        current_rating = profile.codeforces_rating or profile.leetcode_rating or 1200

        problems = await self.catalog.get_all()
        if not problems:
            problems = self._default_problems()

        scored: list[ProblemRecommendation] = []
        for p in problems:
            topic_overlap = len(set(p.topics) & weak_topics) / max(len(weak_topics), 1)
            rating_diff = abs((p.rating or 1500) - current_rating)
            rating_fit = max(0, 1 - rating_diff / 800)
            difficulty_bonus = {"easy": 0.9, "medium": 1.0, "hard": 0.85}.get(p.difficulty, 1.0)
            success_prob = min(0.95, (topic_overlap * 0.5 + rating_fit * 0.5) * difficulty_bonus)

            reason_parts = []
            if topic_overlap > 0:
                reason_parts.append(f"Targets weak topics: {', '.join(set(p.topics) & weak_topics)}")
            if rating_fit > 0.6:
                reason_parts.append("Rating-appropriate challenge")
            if not reason_parts:
                reason_parts.append("Balanced practice problem")

            scored.append(
                ProblemRecommendation(
                    platform=p.platform,
                    slug=p.slug,
                    title=p.title,
                    difficulty=p.difficulty,
                    topics=p.topics,
                    rating=p.rating,
                    url=p.url,
                    success_probability=round(success_prob, 2),
                    reason="; ".join(reason_parts),
                )
            )

        scored.sort(key=lambda x: x.success_probability, reverse=True)
        easy = [p for p in scored if p.difficulty == "easy"][:5]
        medium = [p for p in scored if p.difficulty == "medium"][:5]
        hard = [p for p in scored if p.difficulty == "hard"][:5]

        return RecommendationsResponse(easy=easy, medium=medium, hard=hard)

    def _default_problems(self) -> list:
        from app.models.user import ProblemCatalog

        defaults = [
            ("leetcode", "two-sum", "Two Sum", "easy", ["Implementation"], 800),
            ("leetcode", "climbing-stairs", "Climbing Stairs", "easy", ["DP"], 900),
            ("leetcode", "number-of-islands", "Number of Islands", "medium", ["Graphs"], 1400),
            ("leetcode", "word-break", "Word Break", "medium", ["DP"], 1500),
            ("codeforces", "4A", "Watermelon", "easy", ["Math"], 800),
            ("codeforces", "977F", "Consecutive Subsequence", "hard", ["DP"], 2000),
            ("leetcode", "binary-tree-max-path-sum", "Binary Tree Maximum Path Sum", "hard", ["Trees"], 1800),
            ("leetcode", "course-schedule", "Course Schedule", "medium", ["Graphs"], 1500),
            ("leetcode", "search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "medium", ["Binary Search"], 1400),
            ("leetcode", "minimum-window-substring", "Minimum Window Substring", "hard", ["Strings"], 1900),
        ]
        return [
            ProblemCatalog(
                platform=d[0], slug=d[1], title=d[2], difficulty=d[3], topics=d[4], rating=d[5],
                url=f"https://{'leetcode.com/problems' if d[0] == 'leetcode' else 'codeforces.com/problemset/problem'}/{d[1]}",
            )
            for d in defaults
        ]
