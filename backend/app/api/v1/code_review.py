from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.code_review import CodeReviewRequest, CodeReviewResponse
from app.services.code_review_service import CodeReviewService

router = APIRouter(prefix="/code-review", tags=["code-review"])


@router.post("", response_model=CodeReviewResponse, status_code=201)
async def review_code(
    data: CodeReviewRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CodeReviewService(db).review(user, data)


@router.get("/history", response_model=list[CodeReviewResponse])
async def review_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CodeReviewService(db).list_reviews(user)
