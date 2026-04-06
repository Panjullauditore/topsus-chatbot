# app/repositories/conversation_repo.py
from __future__ import annotations
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, and_, func, cast
from sqlalchemy.sql.sqltypes import Date      # biarin sama
from datetime import datetime, date, timedelta

from app.models.chat import Conversation, Message, MessageRole, ConversationStatus


class ConversationRepository:
    """Repository khusus untuk operasi Conversation (CRUD + helper)."""

    # === CONVERSATION ===
    @staticmethod
    def get_conversation(db: Session, conv_id: int) -> Optional[Conversation]:
        """Ambil satu conversation berdasarkan ID."""
        return db.execute(
            select(Conversation).where(Conversation.id == conv_id)
        ).scalar_one_or_none()

    @staticmethod
    def create_conversation(
        db: Session,
        user_id: Optional[int],
        title: Optional[str] = None,
        meta: Optional[dict] = None,
    ) -> Conversation:
        """Buat conversation baru (biasanya saat user pertama kali chat)."""
        conv = Conversation(user_id=user_id, title=title, meta=meta)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_or_create_conversation(
        db: Session, user_id: Optional[int], conv_id: Optional[int]
    ) -> Conversation:
        """
        Ambil conversation berdasarkan ID.
        Jika tidak ditemukan (atau conv_id=None), otomatis buat baru.
        """
        if conv_id:
            found = ConversationRepository.get_conversation(db, conv_id)
            if found:
                return found
        return ConversationRepository.create_conversation(db, user_id=user_id)

    @staticmethod
    def list_user_conversations(
        db: Session, user_id: int, limit: int = 10, offset: int = 0
    ) -> List[Conversation]:
        """Ambil daftar percakapan milik user tertentu, urut dari terbaru."""
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
            .offset(offset)
        )
        return list(db.execute(stmt).scalars())

    @staticmethod
    def close_conversation(db: Session, conv_id: int) -> Optional[Conversation]:
        """Tutup percakapan (ubah status jadi closed)."""
        conv = ConversationRepository.get_conversation(db, conv_id)
        if not conv:
            return None
        conv.status = ConversationStatus.closed
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def delete_conversation(db: Session, conv_id: int) -> bool:
        """Hapus conversation beserta seluruh pesan di dalamnya."""
        conv = ConversationRepository.get_conversation(db, conv_id)
        if not conv:
            return False
        db.delete(conv)  # cascade delete ke messages
        db.commit()
        return True

    # ========== ANALYTICS (khusus conversation) ==========
    @staticmethod
    def count_conversations(db: Session) -> int:
        return db.execute(select(func.count(Conversation.id))).scalar_one()
