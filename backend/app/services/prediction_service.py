import os
from pathlib import Path

import numpy as np
from sklearn.linear_model import Ridge
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.profile_repository import ProfileRepository
from app.schemas.predictions import InterviewReadiness, RatingPrediction
from app.services.topic_constants import TOPICS


class PredictionService:
    MODEL_DIR = Path(__file__).parent.parent / "ml" / "models"

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileRepository(db)
        self.model = Ridge(alpha=1.0)

    async def predict_ratings(self, user: User) -> RatingPrediction:
        profile = await self.profiles.get_by_user_id(user.id)
        if profile is None:
            return RatingPrediction(
                next_contest_rating=1200,
                three_month_rating=1300,
                six_month_rating=1400,
                confidence=0.3,
                factors={"default": 1.0},
            )

        rating_history = await self.profiles.get_rating_history(profile.id)
        current = profile.codeforces_rating or profile.leetcode_rating or 1200

        if len(rating_history) >= 3:
            features, targets = self._build_training_data(rating_history, profile)
            self.model.fit(features, targets)
            next_features = np.array([[current, profile.contest_count, profile.total_solved, profile.medium_solved]])
            predicted_delta = float(self.model.predict(next_features)[0])
            next_contest = int(max(800, min(3500, current + predicted_delta)))
            three_month = int(max(800, min(3500, current + predicted_delta * 6)))
            six_month = int(max(800, min(3500, current + predicted_delta * 12)))
            confidence = min(0.95, 0.5 + len(rating_history) * 0.05)
        else:
            growth = min(300, profile.total_solved * 2 + profile.contest_count * 10)
            next_contest = int(current + growth * 0.05)
            three_month = int(current + growth * 0.25)
            six_month = int(current + growth * 0.5)
            confidence = 0.45

        return RatingPrediction(
            next_contest_rating=next_contest,
            three_month_rating=three_month,
            six_month_rating=six_month,
            confidence=round(confidence, 2),
            factors={
                "contest_frequency": profile.contest_count,
                "solved_count": profile.total_solved,
                "current_rating": current,
            },
        )

    async def interview_readiness(self, user: User) -> InterviewReadiness:
        profile = await self.profiles.get_by_user_id(user.id)
        topic_scores = await self.profiles.get_topic_scores(profile.id) if profile else []

        rating = (profile.codeforces_rating or profile.leetcode_rating or 1200) if profile else 1200
        total_solved = profile.total_solved if profile else 0
        medium = profile.medium_solved if profile else 0
        hard = profile.hard_solved if profile else 0
        consistency = 60.0

        topic_strength = (
            sum(t.strength_score for t in topic_scores) / max(len(topic_scores), 1) if topic_scores else 30
        )

        base = {
            "rating": min(100, rating / 25),
            "topics": topic_strength * 0.8,
            "solved": min(100, total_solved / 3),
            "hard": min(100, hard * 5),
            "consistency": consistency,
        }

        weights = {
            "amazon": {"rating": 0.2, "topics": 0.25, "solved": 0.25, "hard": 0.15, "consistency": 0.15},
            "google": {"rating": 0.25, "topics": 0.3, "solved": 0.2, "hard": 0.15, "consistency": 0.1},
            "microsoft": {"rating": 0.2, "topics": 0.25, "solved": 0.25, "hard": 0.15, "consistency": 0.15},
            "atlassian": {"rating": 0.15, "topics": 0.2, "solved": 0.3, "hard": 0.2, "consistency": 0.15},
        }

        scores = {}
        for company, w in weights.items():
            scores[company] = int(min(100, sum(base[k] * w[k] for k in w)))

        overall = int(sum(scores.values()) / len(scores))
        return InterviewReadiness(
            amazon=scores["amazon"],
            google=scores["google"],
            microsoft=scores["microsoft"],
            atlassian=scores["atlassian"],
            overall=overall,
            breakdown={k: {**base, "weighted": scores[k]} for k in scores},
        )

    def _build_training_data(self, rating_history: list, profile) -> tuple[np.ndarray, np.ndarray]:
        ratings = [h.rating for h in rating_history]
        features = []
        targets = []
        for i in range(1, len(ratings)):
            features.append([ratings[i - 1], profile.contest_count, profile.total_solved, profile.medium_solved])
            targets.append(ratings[i] - ratings[i - 1])
        return np.array(features), np.array(targets)
