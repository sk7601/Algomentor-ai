from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse
from app.services.roadmap_service import RoadmapService

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])


@router.post("/generate", response_model=RoadmapResponse, status_code=201)
async def generate_roadmap(
    data: RoadmapGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RoadmapService(db).generate(user, data)


@router.get("", response_model=list[RoadmapResponse])
async def list_roadmaps(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RoadmapService(db).list_roadmaps(user)
