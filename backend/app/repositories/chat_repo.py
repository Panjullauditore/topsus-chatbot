# app/repositories/chat_repo.py
from __future__ import annotations
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, and_, func, cast
from sqlalchemy.sql.sqltypes import Date      # ⬅️ tambahkan ini
from datetime import datetime, date, timedelta
from app.models.chat import Conversation, Message, MessageRole, ConversationStatus
from datetime import datetime, date, timedelta



class ChatRepository:
    """Repository khusus untuk operasi Conversation & Message (CRUD + helper)."""

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
            found = ChatRepository.get_conversation(db, conv_id)
            if found:
                return found
        return ChatRepository.create_conversation(db, user_id=user_id)

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
        conv = ChatRepository.get_conversation(db, conv_id)
        if not conv:
            return None
        conv.status = ConversationStatus.closed
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def delete_conversation(db: Session, conv_id: int) -> bool:
        """Hapus conversation beserta seluruh pesan di dalamnya."""
        conv = ChatRepository.get_conversation(db, conv_id)
        if not conv:
            return False
        db.delete(conv)  # cascade delete ke messages
        db.commit()
        return True

    # === MESSAGE ===
    @staticmethod
    def add_message(
        db: Session,
        conv_id: int,
        role: MessageRole,
        content: str,
        *,
        source: Optional[str] = None,
        intent: Optional[str] = None,
        confidence: Optional[float] = None,  # disimpan *1000*
        latency_ms: Optional[int] = None,
        meta: Optional[dict] = None,
    ) -> Message:
        """Tambah satu pesan ke dalam conversation (baik user maupun assistant)."""
        conf_int = int(round(confidence * 1000)) if confidence is not None else None
        msg = Message(
            conversation_id=conv_id,
            role=role,
            content=content,
            source=source,
            intent=intent,
            confidence=conf_int,
            latency_ms=latency_ms,
            meta=meta,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def list_messages_tail(
        db: Session,
        conv_id: int,
        limit: int = 10,
        before_id: Optional[int] = None,
    ) -> List[Message]:
        """
        Ambil beberapa pesan terakhir dari conversation (default 10).
        Kalau `before_id` diisi, ambil pesan yang lebih lama dari pesan tsb.
        """
        conds = [Message.conversation_id == conv_id]
        if before_id is not None:
            subq = select(Message.created_at).where(Message.id == before_id).scalar_subquery()
            conds.append(Message.created_at < subq)

        stmt = (
            select(Message)
            .where(and_(*conds))
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        rows = list(db.execute(stmt).scalars())
        rows.reverse()  # dibalik jadi ascending (dari lama ke baru)
        return rows
# ========== ANALYTICS ==========
    @staticmethod
    def count_conversations(db: Session) -> int:
        return db.execute(select(func.count(Conversation.id))).scalar_one()

    @staticmethod
    def count_messages(db: Session) -> int:
        return db.execute(select(func.count(Message.id))).scalar_one()

    @staticmethod
    def count_today(db: Session) -> tuple[int,int]:
        # asumsi timezone DB UTC; kalau pakai tz-aware, adjust di service
        today = date.today()
        tomorrow = today + timedelta(days=1)
        conv_today = db.execute(
            select(func.count(Conversation.id))
            .where(Conversation.started_at >= today, Conversation.started_at < tomorrow)
        ).scalar_one()
        msg_today = db.execute(
            select(func.count(Message.id))
            .where(Message.created_at >= today, Message.created_at < tomorrow)
        ).scalar_one()
        return conv_today, msg_today

    @staticmethod
    def messages_by_source(db: Session) -> list[tuple[str,int]]:
        rows = db.execute(
            select(Message.source, func.count(Message.id))
            .group_by(Message.source)
        ).all()
        # ganti None jadi "unknown"
        return [(r[0] or "unknown", r[1]) for r in rows]

    @staticmethod
    def messages_by_role(db: Session) -> list[tuple[str,int]]:
        rows = db.execute(
            select(Message.role, func.count(Message.id))
            .group_by(Message.role)
        ).all()
        return [(r[0].value if hasattr(r[0], "value") else r[0], r[1]) for r in rows]

    @staticmethod
    def messages_per_day(db: Session, days: int = 14) -> list[tuple[date,int]]:
        # Postgres: date_trunc
        start = date.today() - timedelta(days=days-1)
        rows = db.execute(
            select(cast(func.date_trunc('day', Message.created_at), Date), func.count(Message.id))
            .where(Message.created_at >= start)
            .group_by(cast(func.date_trunc('day', Message.created_at), Date))
            .order_by(cast(func.date_trunc('day', Message.created_at), Date))
        ).all()
        return rows

    # ========== CHATLOG (search + pagination) ==========
    @staticmethod
    def search_chatlog(
        db: Session,
        *,
        limit: int = 20,
        offset: int = 0,
        user_id: int | None = None,
        conversation_id: int | None = None,
        role: MessageRole | None = None,
        source: str | None = None,
        intent: str | None = None,
        q: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[int, list[Message]]:
        conds = []
        if user_id is not None:
            # join ke Conversation
            conds.append(Message.conversation_id == Conversation.id)
        stmt_base = select(Message)
        if user_id is not None:
            stmt_base = stmt_base.join(Conversation)

        if conversation_id is not None:
            conds.append(Message.conversation_id == conversation_id)
        if user_id is not None:
            conds.append(Conversation.user_id == user_id)
        if role is not None:
            conds.append(Message.role == role)
        if source is not None:
            conds.append(Message.source == source)
        if intent is not None:
            conds.append(Message.intent == intent)
        if q:
            conds.append(Message.content.ilike(f"%{q}%"))
        if date_from:
            conds.append(Message.created_at >= date_from)
        if date_to:
            # eksklusif upper bound
            conds.append(Message.created_at < date_to + timedelta(days=1))

        stmt = (
            stmt_base
            .where(and_(*conds)) if conds else stmt_base
        )
        total = db.execute(
            stmt.with_only_columns(func.count()).order_by(None)
        ).scalar_one()

        rows = db.execute(
            stmt.order_by(desc(Message.created_at)).limit(limit).offset(offset)
        ).scalars().all()

        return total, rows