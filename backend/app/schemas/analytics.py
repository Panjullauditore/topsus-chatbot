# app/schemas/analytics.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class KVInt(BaseModel):
    key: str
    value: int

class SeriesPoint(BaseModel):
    date: date
    count: int

class AnalyticsOut(BaseModel):
    total_conversations: int
    total_messages: int
    today_conversations: int
    today_messages: int
    by_source: List[KVInt]          # contoh: [{"key":"rasa","value":21},{"key":"rag","value":34}]
    by_role: List[KVInt]            # user vs assistant
    messages_per_day: List[SeriesPoint]

# ================== CHATLOG ==================
class ChatLogItem(BaseModel):
    id: int
    conversation_id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    role: str
    content: str
    source: Optional[str] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    latency_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatLogOut(BaseModel):
    total: int
    items: List[ChatLogItem]
