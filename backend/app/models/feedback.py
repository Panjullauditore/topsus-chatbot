# app/models/feedback.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.core.db import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(
        Integer,
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,          # satu feedback per pesan
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    vote = Column(String(4), nullable=False)     # "up" atau "down"
    comment = Column(Text, nullable=True)        # opsional komentar singkat
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
