from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.external.platform_clients import CodeforcesClient, LeetCodeClient
from app.models.user import CompetitiveProfile, RatingHistory, Submission, TopicScore, User
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import ProfileLinkRequest, ProfileResponse, ProfileSyncResponse, TopicScoreItem
from app.services.topic_analysis_service import TopicAnalysisService


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileRepository(db)
        self.cf_client = CodeforcesClient()
        self.lc_client = LeetCodeClient()
        self.topic_service = TopicAnalysisService()

    async def get_profile(self, user: User) -> ProfileResponse | None:
        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            return None
        return ProfileResponse.model_validate(profile)

    async def link_and_sync(self, user: User, data: ProfileLinkRequest) -> ProfileSyncResponse:
        if not data.codeforces_handle and not data.leetcode_username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one handle")

        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            profile = CompetitiveProfile(user_id=user.id)
        if data.codeforces_handle:
            profile.codeforces_handle = data.codeforces_handle.strip()
        if data.leetcode_username:
            profile.leetcode_username = data.leetcode_username.strip()

        all_submissions: list[dict] = []
        all_rating_history: list[dict] = []
        raw_data: dict = {}

        if profile.codeforces_handle:
            cf_data = await self.cf_client.fetch_profile(profile.codeforces_handle)
            profile.codeforces_rating = cf_data.get("rating")
            profile.max_codeforces_rating = cf_data.get("max_rating")
            profile.contest_count = len(cf_data.get("rating_history", []))
            all_submissions.extend(self.cf_client.parse_submissions(cf_data.get("submissions", [])))
            all_rating_history.extend(self.cf_client.parse_rating_history(cf_data.get("rating_history", [])))
            raw_data["codeforces"] = {"handle": profile.codeforces_handle, "rank": cf_data.get("rank")}

        if profile.leetcode_username:
            lc_data = await self.lc_client.fetch_profile(profile.leetcode_username)
            lc_stats = self.lc_client.parse_profile_stats(lc_data)
            profile.leetcode_rating = lc_stats["leetcode_rating"]
            profile.max_leetcode_rating = max(
                profile.max_leetcode_rating or 0, lc_stats["leetcode_rating"]
            )
            profile.easy_solved = lc_stats["easy_solved"]
            profile.medium_solved = lc_stats["medium_solved"]
            profile.hard_solved = lc_stats["hard_solved"]
            profile.total_solved = lc_stats["total_solved"]
            all_submissions.extend(self.lc_client.parse_submissions_from_stats(lc_data))
            all_rating_history.extend(
                self.lc_client.build_synthetic_rating_history(lc_stats["leetcode_rating"])
            )
            raw_data["leetcode"] = {"username": profile.leetcode_username, "ranking": lc_stats.get("ranking")}

        if profile.codeforces_handle and not profile.leetcode_username:
            profile.total_solved = len(all_submissions)
            profile.easy_solved = sum(1 for s in all_submissions if s["difficulty"] == "easy")
            profile.medium_solved = sum(1 for s in all_submissions if s["difficulty"] == "medium")
            profile.hard_solved = sum(1 for s in all_submissions if s["difficulty"] == "hard")

        profile.raw_data = raw_data
        profile.last_synced_at = datetime.now(tz=UTC)
        profile = await self.profiles.upsert(profile)

        await self.profiles.clear_submissions(profile.id)
        await self.profiles.clear_rating_history(profile.id)
        await self.profiles.clear_topic_scores(profile.id)

        submission_models = [
            Submission(
                profile_id=profile.id,
                platform=s["platform"],
                problem_slug=s["problem_slug"],
                problem_title=s["problem_title"],
                difficulty=s["difficulty"],
                topics=s["topics"],
                verdict=s["verdict"],
                submitted_at=s.get("submitted_at"),
            )
            for s in all_submissions
        ]
        rating_models = [
            RatingHistory(
                profile_id=profile.id,
                platform=r["platform"],
                rating=r["rating"],
                contest_name=r.get("contest_name"),
                recorded_at=r["recorded_at"],
            )
            for r in all_rating_history
        ]
        topic_scores = self.topic_service.compute_scores(all_submissions)
        topic_models = [
            TopicScore(
                profile_id=profile.id,
                topic=t["topic"],
                strength_score=t["strength_score"],
                weakness_score=t["weakness_score"],
                problems_solved=t["problems_solved"],
                problems_attempted=t["problems_attempted"],
            )
            for t in topic_scores
        ]

        await self.profiles.add_submissions(submission_models)
        await self.profiles.add_rating_history(rating_models)
        await self.profiles.add_topic_scores(topic_models)

        return ProfileSyncResponse(
            profile=ProfileResponse.model_validate(profile),
            rating_history=[r for r in rating_models],
            topic_scores=[TopicScoreItem.model_validate(t) for t in topic_models],
            message="Profile synced successfully",
        )
