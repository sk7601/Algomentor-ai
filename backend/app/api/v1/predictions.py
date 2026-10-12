from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.predictions import InterviewReadiness, RatingPrediction, RecommendationsResponse
from app.services.prediction_service import PredictionService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/ratings", response_model=RatingPrediction)
async def predict_ratings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService(db).predict_ratings(user)


@router.get("/interview-readiness", response_model=InterviewReadiness)
async def interview_readiness(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService(db).interview_readiness(user)


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RecommendationService(db).get_recommendations(user)
