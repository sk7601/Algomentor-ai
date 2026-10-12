from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.external.gemini_client import GeminiClient
from app.models.user import ChatMessage, ChatSession, User
from app.repositories.profile_repository import ChatRepository
from app.schemas.tutor import ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse


class TutorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chats = ChatRepository(db)
        self.gemini = GeminiClient()

    async def create_session(self, user: User, data: ChatSessionCreate) -> ChatSessionResponse:
        session = ChatSession(user_id=user.id, title=data.title)
        session = await self.chats.create_session(session)
        return ChatSessionResponse.model_validate(session)

    async def list_sessions(self, user: User) -> list[ChatSessionResponse]:
        sessions = await self.chats.list_sessions(user.id)
        return [ChatSessionResponse.model_validate(s) for s in sessions]

    async def get_session(self, user: User, session_id) -> ChatSessionResponse:
        session = await self.chats.get_session(session_id, user.id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return ChatSessionResponse.model_validate(session)

    async def send_message(self, user: User, session_id, data: ChatMessageCreate) -> ChatMessageResponse:
        session = await self.chats.get_session(session_id, user.id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        user_msg = ChatMessage(session_id=session.id, role="user", content=data.content)
        await self.chats.add_message(user_msg)

        history = [{"role": m.role, "content": m.content} for m in session.messages]
        history.append({"role": "user", "content": data.content})

        ai_data = await self.gemini.tutor_response(data.content, history)
        explanation = ai_data.get("explanation", ai_data.get("raw_response", ""))
        complexity = ai_data.get("complexity", "See explanation")
        examples = ai_data.get("examples", [])
        practice = ai_data.get("practice_problems", [])

        response_text = (
            f"**Explanation**\n{explanation}\n\n"
            f"**Complexity**\n{complexity}\n\n"
            f"**Examples**\n" + "\n".join(f"- {e}" for e in examples) + "\n\n"
            f"**Practice Problems**\n" + "\n".join(f"- {p}" for p in practice)
        )

        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text,
            message_metadata={
                "explanation": explanation,
                "complexity": complexity,
                "examples": examples,
                "practice_problems": practice,
            },
        )
        assistant_msg = await self.chats.add_message(assistant_msg)
        session.updated_at = datetime.now(tz=UTC)
        return ChatMessageResponse.model_validate(assistant_msg)
