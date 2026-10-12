from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Roadmap, User
from app.repositories.profile_repository import ProfileRepository, RoadmapRepository
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse
from app.services.topic_analysis_service import TopicAnalysisService


class RoadmapService:
    TOPIC_RESOURCES = {
        "DP": ["AtCoder DP Contest", "CSES DP section", "USACO Guide DP"],
        "Graphs": ["CSES Graph section", "Codeforces Graph tutorials", "BFS/DFS drills"],
        "Trees": ["CSES Tree section", "HLD basics", "Centroid decomposition intro"],
        "Greedy": ["Codeforces Greedy tag", "Exchange argument patterns"],
        "Binary Search": ["Binary search on answer", "CSES Sorting and Searching"],
        "Math": ["Number theory basics", "Modular arithmetic", "Combinatorics"],
        "Strings": ["KMP", "Z-algorithm", "String hashing"],
        "Implementation": ["Simulation drills", "STL mastery", "Fast I/O practice"],
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileRepository(db)
        self.roadmaps = RoadmapRepository(db)
        self.topic_service = TopicAnalysisService()

    async def generate(self, user: User, data: RoadmapGenerateRequest) -> RoadmapResponse:
        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile required")

        topic_scores = await self.profiles.get_topic_scores(profile.id)
        topic_dicts = [
            {
                "topic": t.topic,
                "weakness_score": t.weakness_score,
                "strength_score": t.strength_score,
            }
            for t in topic_scores
        ]
        weak_topics = self.topic_service.get_weak_topics(topic_dicts, limit=4)
        current_rating = profile.codeforces_rating or profile.leetcode_rating or 1200
        rating_gap = data.target_rating - current_rating
        weeks = data.duration_weeks

        plan = {"weeks": []}
        topics_cycle = weak_topics or ["DP", "Graphs", "Greedy"]
        problems_per_week = max(5, min(20, weeks * 2))
        rating_per_week = rating_gap / weeks if weeks else 0

        for week in range(1, weeks + 1):
            focus = topics_cycle[(week - 1) % len(topics_cycle)]
            resources = self.TOPIC_RESOURCES.get(focus, ["Practice problems"])
            plan["weeks"].append(
                {
                    "week": week,
                    "focus_topics": [focus],
                    "problems": [
                        f"{focus} problem set - Day {d + 1}"
                        for d in range(min(problems_per_week, 7))
                    ],
                    "goals": [
                        f"Solve {problems_per_week} {focus} problems",
                        f"Target rating gain: +{int(rating_per_week)}",
                        f"Study: {resources[0]}",
                    ],
                    "estimated_hours": 8 + (week % 3) * 2,
                    "resources": resources,
                }
            )

        roadmap = Roadmap(
            user_id=user.id,
            duration_weeks=weeks,
            target_rating=data.target_rating,
            current_rating=current_rating,
            weak_topics=weak_topics,
            plan=plan,
        )
        roadmap = await self.roadmaps.create(roadmap)
        return RoadmapResponse.model_validate(roadmap)

    async def list_roadmaps(self, user: User) -> list[RoadmapResponse]:
        roadmaps = await self.roadmaps.list_for_user(user.id)
        return [RoadmapResponse.model_validate(r) for r in roadmaps]
