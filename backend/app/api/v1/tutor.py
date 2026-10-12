from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.tutor import ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(
    data: ChatSessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TutorService(db).create_session(user, data)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TutorService(db).list_sessions(user)


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TutorService(db).get_session(user, session_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: UUID,
    data: ChatMessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await TutorService(db).send_message(user, session_id, data)
