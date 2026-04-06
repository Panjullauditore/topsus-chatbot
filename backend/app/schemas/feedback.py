# app/schemas/feedback.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackIn(BaseModel):
    message_id: int
    vote: str          # "up" | "down"
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    message_id: int
    user_id: Optional[int] = None
    vote: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
