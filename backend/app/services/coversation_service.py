# app/services/conversation_service.py
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.models.chat import MessageRole, Conversation, Message
import time
from app.services import rasa_client, rag_client
from app.core.config import settings

class ConversationService:
    """Service layer untuk manajemen percakapan & pesan."""

    def __init__(self, db: Session):
        """
        Inisialisasi service dengan session database.
        Param:
            db (Session): SQLAlchemy session aktif
        """
        self.db = db

    # ========== CONVERSATION ==========

    def get_or_start(self, user_id: Optional[int], conv_id: Optional[int]) -> Conversation:
        """Ambil conversation jika ada, kalau tidak buat baru."""
        return ConversationRepository.get_or_create_conversation(self.db, user_id, conv_id)

    def list_user_conversations(self, user_id: int, limit: int = 10) -> List[Conversation]:
        """Ambil daftar percakapan milik user tertentu (10 terakhir)."""
        return ConversationRepository.list_user_conversations(self.db, user_id, limit)
    def close(self, conv_id: int) -> Optional[Conversation]:
        """Tutup percakapan tertentu."""
        return ConversationRepository.close_conversation(self.db, conv_id)

    def delete(self, conv_id: int) -> bool:
        """Hapus percakapan beserta semua pesannya."""
        return ConversationRepository.delete_conversation(self.db, conv_id)
    # ========== MESSAGE ==========

    def record_user_message(self, conv_id: int, text: str) -> Message:
        """Simpan pesan dari user ke dalam conversation."""
        return MessageRepository.add_message(
            self.db,
            conv_id,
            MessageRole.user,
            text,
        )

    def record_assistant_message(
        self,
        conv_id: int,
        text: str,
        *,
        source: str = "rules",
        intent: Optional[str] = None,
        confidence: Optional[float] = None,
        latency_ms: Optional[int] = None,
        meta: Optional[dict] = None,
    ) -> Message:
        """Simpan pesan balasan dari bot/assistant."""
        return MessageRepository.add_message(
            self.db,
            conv_id,
            MessageRole.assistant,
            text,
            source=source,
            intent=intent,
            confidence=confidence,
            latency_ms=latency_ms,
            meta=meta,
        )

    def tail(self, conv_id: int, limit: int = 10, before_id: Optional[int] = None) -> List[Message]:
        """Ambil sejumlah pesan terakhir dari conversation (default 10)."""
        return MessageRepository.list_messages_tail(self.db, conv_id, limit, before_id)

    # ========== REPLY LOGIC  ==========

    async def generate_reply(self, user_text: str):
            """
            Kirim ke Rasa dulu, kalau fallback → lanjut ke RAG
            """
            t0 = time.perf_counter()
            intent, conf = None, 0.0

            # --- 1) Coba parse ke Rasa
            try:
                parsed = await rasa_client.nlu_parse(user_text)
                intent = (parsed.get("intent") or {}).get("name")
                conf = float((parsed.get("intent") or {}).get("confidence") or 0.0)
            except Exception as e:
                print("[WARN] gagal call Rasa parse:", e)

           # --- 2) Rasa kalau confident & bukan fallback
            if conf >= settings.RASA_THRESHOLD and intent != "nlu_fallback":
                try:
                    print(f"[DEBUG] use RASA reply (intent={intent}, conf={conf})")
                    msgs = await rasa_client.reply_via_webhook("web-user", user_text)
                    
                    # Join all text messages from Rasa
                    text = "\n\n".join([m.get("text") for m in msgs if "text" in m])
                    if not text:
                        text = "Maaf, tidak ada balasan."
                    
                    meta = {"source": "rasa", "intent": intent, "confidence": conf,
                            "latency_ms": int((time.perf_counter()-t0)*1000)}
                    print("[DEBUG] returning from RASA")
                    return text, meta
                except Exception as e:
                    print("[WARN] gagal ambil balasan Rasa:", repr(e))

            # --- 3) Fallback ke RAG
            try:
                print(f"[DEBUG] fallback ke RAG (intent={intent}, conf={conf}, url={settings.RAG_URL})")
                rag = await rag_client.ask(user_text)
                answer = rag.get("answer") or "Maaf, belum ada jawaban."
                
                if "**[JAWABAN RAG]**" in answer:
                    text = answer
                else:
                    text = f"📚 **[JAWABAN RAG]**\n\n{answer}"
                meta = {"source":"rag","intent":intent,"confidence":conf,
                        "latency_ms":int((time.perf_counter()-t0)*1000),
                        "citations": rag.get("sources")}
                print("[DEBUG] returning from RAG")
                return text, meta
            except Exception as e:
                print("[WARN] gagal call RAG:", repr(e))

            # --- 4) Ultimate fallback
            print("[DEBUG] returning from FALLBACK")
            text = "Maaf, saya tidak menemukan jawaban yang relevan di sistem saya. Silakan hubungi bagian akademik atau coba gunakan kata kunci lain. 🙏"
            meta = {"source":"rules","intent":intent,"confidence":conf,
                    "latency_ms":int((time.perf_counter()-t0)*1000)}
            return text, meta
