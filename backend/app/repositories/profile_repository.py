from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import (
    ChatMessage,
    ChatSession,
    CodeReview,
    CompetitiveProfile,
    ProblemCatalog,
    RatingHistory,
    RefreshToken,
    Roadmap,
    Submission,
    TopicScore,
)


class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: UUID) -> CompetitiveProfile | None:
        result = await self.db.execute(
            select(CompetitiveProfile)
            .where(CompetitiveProfile.user_id == user_id)
            .options(
                selectinload(CompetitiveProfile.rating_history),
                selectinload(CompetitiveProfile.topic_scores),
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, profile: CompetitiveProfile) -> CompetitiveProfile:
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def clear_submissions(self, profile_id: UUID) -> None:
        await self.db.execute(delete(Submission).where(Submission.profile_id == profile_id))

    async def clear_rating_history(self, profile_id: UUID) -> None:
        await self.db.execute(delete(RatingHistory).where(RatingHistory.profile_id == profile_id))

    async def clear_topic_scores(self, profile_id: UUID) -> None:
        await self.db.execute(delete(TopicScore).where(TopicScore.profile_id == profile_id))

    async def add_submissions(self, submissions: list[Submission]) -> None:
        self.db.add_all(submissions)

    async def add_rating_history(self, entries: list[RatingHistory]) -> None:
        self.db.add_all(entries)

    async def add_topic_scores(self, scores: list[TopicScore]) -> None:
        self.db.add_all(scores)

    async def get_submissions(self, profile_id: UUID) -> list[Submission]:
        result = await self.db.execute(
            select(Submission).where(Submission.profile_id == profile_id).order_by(Submission.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def get_rating_history(self, profile_id: UUID) -> list[RatingHistory]:
        result = await self.db.execute(
            select(RatingHistory)
            .where(RatingHistory.profile_id == profile_id)
            .order_by(RatingHistory.recorded_at.asc())
        )
        return list(result.scalars().all())

    async def get_topic_scores(self, profile_id: UUID) -> list[TopicScore]:
        result = await self.db.execute(select(TopicScore).where(TopicScore.profile_id == profile_id))
        return list(result.scalars().all())


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, token: RefreshToken) -> RefreshToken:
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        result = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        token.revoked = True
        await self.db.flush()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        )
        for token in result.scalars().all():
            token.revoked = True


class RoadmapRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, roadmap: Roadmap) -> Roadmap:
        self.db.add(roadmap)
        await self.db.flush()
        await self.db.refresh(roadmap)
        return roadmap

    async def list_for_user(self, user_id: UUID) -> list[Roadmap]:
        result = await self.db.execute(
            select(Roadmap).where(Roadmap.user_id == user_id).order_by(Roadmap.created_at.desc())
        )
        return list(result.scalars().all())


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(self, session: ChatSession) -> ChatSession:
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: UUID, user_id: UUID) -> ChatSession | None:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .options(selectinload(ChatSession.messages))
        )
        return result.scalar_one_or_none()

    async def list_sessions(self, user_id: UUID) -> list[ChatSession]:
        result = await self.db.execute(
            select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.updated_at.desc())
        )
        return list(result.scalars().all())

    async def add_message(self, message: ChatMessage) -> ChatMessage:
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message


class CodeReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, review: CodeReview) -> CodeReview:
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def list_for_user(self, user_id: UUID) -> list[CodeReview]:
        result = await self.db.execute(
            select(CodeReview).where(CodeReview.user_id == user_id).order_by(CodeReview.created_at.desc())
        )
        return list(result.scalars().all())


class ProblemCatalogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[ProblemCatalog]:
        result = await self.db.execute(select(ProblemCatalog))
        return list(result.scalars().all())

    async def bulk_create(self, problems: list[ProblemCatalog]) -> None:
        self.db.add_all(problems)

    async def count(self) -> int:
        result = await self.db.execute(select(ProblemCatalog))
        return len(list(result.scalars().all()))
