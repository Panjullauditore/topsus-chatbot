# app/services/feedback_service.py
from sqlalchemy.orm import Session
from app.repositories.feedback_repo import FeedbackRepository
from app.models.feedback import Feedback
from typing import Optional


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db

    def submit(self, message_id: int, user_id: Optional[int], vote: str, comment: Optional[str] = None) -> Feedback:
        if vote not in ("up", "down"):
            raise ValueError("vote must be 'up' or 'down'")
        return FeedbackRepository.upsert(self.db, message_id, user_id, vote, comment)

    def get_for_message(self, message_id: int) -> Optional[Feedback]:
        return FeedbackRepository.get_by_message(self.db, message_id)

    def stats(self) -> dict:
        return FeedbackRepository.count_votes(self.db)
