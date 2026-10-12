from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class ChatSessionCreate(BaseModel):
    title: str = Field(default="New Tutor Session", max_length=255)


class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    message_metadata: dict | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ChatSessionResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = []

    model_config = {"from_attributes": True}


class TutorReply(BaseModel):
    explanation: str
    complexity: str
    examples: list[str]
    practice_problems: list[str]
    raw_response: str
