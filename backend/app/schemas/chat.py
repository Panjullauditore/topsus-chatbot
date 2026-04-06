from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# 🟢 input untuk kirim chat
class SendChatIn(BaseModel):
    user_id: Optional[int] = None        # nanti diambil dari token
    conversation_id: Optional[int] = None
    user_message: str

class SendChatInNoUser(BaseModel):
    conversation_id: int | None = None
    user_message: str

# 🟢 output satu message
class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    source: Optional[str] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    latency_ms: Optional[int] = None
    meta: Optional[dict] = None

    class Config:
        from_attributes = True   # biar bisa langsung pakai dari SQLAlchemy object


# 🟢 output untuk 1 conversation
class ConversationOut(BaseModel):
    id: int
    user_id: Optional[int]
    status: str
    started_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    title: Optional[str] = None
    meta: Optional[dict] = None

    class Config:
        from_attributes = True


# 🟢 output utama saat user kirim pesan
class ChatResponse(BaseModel):
    conversation_id: int
    reply: str
    messages_tail: List[MessageOut] = []
