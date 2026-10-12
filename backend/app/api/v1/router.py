from fastapi import APIRouter

from app.api.v1 import analytics, auth, code_review, predictions, profiles, roadmaps, tutor

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(analytics.router)
api_router.include_router(roadmaps.router)
api_router.include_router(tutor.router)
api_router.include_router(code_review.router)
api_router.include_router(predictions.router)
