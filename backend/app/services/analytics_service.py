# app/services/analytics_service.py
from requests import Session
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.analytics import AnalyticsOut, KVInt, SeriesPoint

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def snapshot(self) -> AnalyticsOut:
        total_conv = ConversationRepository.count_conversations(self.db)
        total_msg = MessageRepository.count_messages(self.db)
        today_conv, today_msg = MessageRepository.count_today(self.db)
        by_src = [KVInt(key=k, value=v) for k,v in MessageRepository.messages_by_source(self.db)]
        by_role = [KVInt(key=k, value=v) for k,v in MessageRepository.messages_by_role(self.db)]
        series = [SeriesPoint(date=d, count=c) for d,c in MessageRepository.messages_per_day(self.db, days=14)]
        return AnalyticsOut(
            total_conversations=total_conv,
            total_messages=total_msg,
            today_conversations=today_conv,
            today_messages=today_msg,
            by_source=by_src,
            by_role=by_role,
            messages_per_day=series,
        )
