from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Integer, Enum, JSON, Index, func
)
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import enum
from app.core.db import Base  # pastikan sudah ada Base = declarative_base()
from app.models.user import User  # pastikan import model User


class ConversationStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    archived = "archived"

class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    # was: String(64)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    closed_at  = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(ConversationStatus), default=ConversationStatus.open, nullable=False)
    title  = Column(String(160), nullable=True)
    meta   = Column(JSON, nullable=True)

    user = relationship(User, lazy="joined")  # <-- akses conv.user
    messages = relationship(
        "Message", back_populates="conversation",
        cascade="all, delete-orphan", order_by="Message.created_at", lazy="selectin"
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)

    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # opsional analytics/debugging
    source = Column(String(16), nullable=True)      # "rasa" | "rag" | "rules"
    intent = Column(String(64), nullable=True)
    confidence = Column(Integer, nullable=True)     # simpan *1000* (0–1000)
    latency_ms = Column(Integer, nullable=True)

    meta = Column(JSON, nullable=True)

    conversation = relationship("Conversation", back_populates="messages", lazy="joined")

Index("ix_messages_conv_created_desc", Message.conversation_id, Message.created_at.desc())
