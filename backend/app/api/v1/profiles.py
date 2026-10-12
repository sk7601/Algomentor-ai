from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import ProfileLinkRequest, ProfileResponse, ProfileSyncResponse
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse | None)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).get_profile(user)


@router.post("/sync", response_model=ProfileSyncResponse)
async def sync_profile(
    data: ProfileLinkRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileService(db).link_and_sync(user, data)
