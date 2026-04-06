# app/controllers/chat.py
from app.repositories.user_repo import UserRepository
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.schemas.chat import SendChatIn, ChatResponse, ConversationOut, MessageOut
from app.services.coversation_service import ConversationService
from app.core.deps import get_current_user 
from app.schemas.analytics import AnalyticsOut, ChatLogOut, ChatLogItem
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.services.analytics_service import AnalyticsService
from app.models.chat import MessageRole
from datetime import datetime, date, timedelta


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
async def send_chat(
    body: SendChatIn, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # ✅ ambil user aktif dari token/cookie
):
    """
    Endpoint utama untuk mengirim pesan user.
    - Kalau belum ada conversation → auto-create
    - Simpan pesan user
    - Panggil logic reply (sementara: echo)
    - Simpan pesan bot
    - Balikkan reply + 10 pesan terakhir
    """
    svc = ConversationService(db)
    # ✅ Gunakan ID user dari token, bukan dari body FE
    conv = svc.get_or_start(current_user.id, body.conversation_id)

    # simpan pesan user
    svc.record_user_message(conv.id, body.user_message)

    # generate balasan 
    reply_text, meta = await svc.generate_reply(body.user_message)

    # simpan balasan bot
    svc.record_assistant_message(
        conv.id, reply_text,
        source=meta.get("source"),
        intent=meta.get("intent"),
        confidence=meta.get("confidence"),
        latency_ms=meta.get("latency_ms"),
        meta=meta,
    )

    # ambil tail (10 pesan terakhir)
    tail = svc.tail(conv.id, limit=10)

    # konversi confidence ke float 0–1
    tail_out: List[MessageOut] = []
    for m in tail:
        tail_out.append(
            MessageOut(
                id=m.id,
                role=m.role.value,
                content=m.content,
                created_at=m.created_at,
                source=m.source,
                intent=m.intent,
                confidence=(m.confidence / 1000 if m.confidence else None),
                latency_ms=m.latency_ms,
                meta=m.meta,
            )
        )

    return ChatResponse(
        conversation_id=conv.id,
        reply=reply_text,
        messages_tail=tail_out,
    )


@router.get("/conversations", response_model=List[ConversationOut])
def get_user_conversations(
    user_id: int = Query(..., description="ID user yang ingin diambil history-nya"),
    db: Session = Depends(get_db),
):
    """
    Ambil daftar 10 percakapan terakhir milik user tertentu.
    """
    svc = ConversationService(db)
    convs = svc.list_user_conversations(user_id, limit=10)
    return convs


@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
def get_messages(
    conv_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(20, description="Jumlah pesan terakhir yang ingin ditampilkan"),
):
    """
    Ambil pesan-pesan dalam 1 conversation.
    Default: 20 pesan terakhir (urut lama-ke-baru).
    """
    svc = ConversationService(db)
    tail = svc.tail(conv_id, limit=limit)

    return [
        MessageOut(
            id=m.id,
            role=m.role.value,
            content=m.content,
            created_at=m.created_at,
            source=m.source,
            intent=m.intent,
            confidence=(m.confidence / 1000 if m.confidence else None),
            latency_ms=m.latency_ms,
            meta=m.meta,
        )
        for m in tail
    ]


@router.post("/conversations/{conv_id}/close", response_model=ConversationOut)
def close_conversation(conv_id: int, db: Session = Depends(get_db)):
    """
    Tutup percakapan (status = closed).
    """
    svc = ConversationService(db)
    conv = svc.close(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    """
    Hapus percakapan beserta semua pesannya.
    """
    svc = ConversationService(db)
    deleted = svc.delete(conv_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "conversation_id": conv_id}

# ---------------- ANALYTICS ----------------
@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
):
    """
    Stats ringkas untuk dashboard admin.
    - total_conversations, total_messages
    - today_conversations, today_messages
    - by_source (rasa/rag/unknown)
    - by_role (user/assistant)
    - messages_per_day (14 hari terakhir)
    """
    svc = AnalyticsService(db)
    return svc.snapshot()

# ---------------- CHATLOG ----------------
@router.get("/chatlog", response_model=ChatLogOut)
def chatlog(
    db: Session = Depends(get_db),
    # filter basic
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = Query(None),
    user_email: Optional[str] = Query(None),
    conversation_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None, description="user|assistant"),
    source: Optional[str] = Query(None, description="rasa|rag|other"),
    intent: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="full-text search content"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),

):
    # role
    role_enum = MessageRole(role) if role else None

    # # ⬅️ JANGAN ADA if not user DI LUAR BLOK INI
    # if user_email:
    #     from app.repositories.user_repo import UserRepository  # atau import di atas file

    #     user = UserRepository.search_by_email(db, user_email)
    #     if not user:
    #         # kalau email nggak ketemu, balikin kosong aja
    #         return ChatLogOut(total=0, items=[])
    #     user_id = user.id
    if user_email:
        from app.repositories.user_repo import UserRepository
        # Cari user dengan pola email (ILIKE)
        users = UserRepository.search_by_email(db, user_email)
        if not users:
            # Jika potongan email tidak ada yang cocok, langsung balikkan kosong
            return ChatLogOut(total=0, items=[])
        # Ambil ID dari hasil pertama yang ditemukan
        user_id = users[0].id
        # Tambahkan Print Debug di terminal backend kamu buat cek ID yang dicari
    print(f"DEBUG: Searching logs for user_id={user_id} with query q={q}")

    total, rows = MessageRepository.search_chatlog(
        db,
        limit=limit,
        offset=offset,
        user_id=user_id,
        conversation_id=conversation_id,
        role=role_enum,
        source=source,
        intent=intent,
        q=q,
        date_from=date_from,
        date_to=date_to,
    )

    items = [
        ChatLogItem(
            id=m.id,
            conversation_id=m.conversation_id,
            user_id=getattr(m.conversation, "user_id", None) if hasattr(m, "conversation") else None,
            user_email=m.conversation.user.email if hasattr(m, "conversation") and m.conversation and hasattr(m.conversation, "user") and m.conversation.user else None,
            role=m.role.value if hasattr(m.role, "value") else m.role,
            content=m.content,
            source=m.source,
            intent=m.intent,
            confidence=(m.confidence / 1000 if m.confidence else None),
            latency_ms=m.latency_ms,
            created_at=m.created_at,
        )
        for m in rows
    ]
    return ChatLogOut(total=total, items=items)