# app/repositories/feedback_repo.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.feedback import Feedback
from typing import Optional, List, Tuple


class FeedbackRepository:

    @staticmethod
    def upsert(db: Session, message_id: int, user_id: Optional[int], vote: str, comment: Optional[str] = None) -> Feedback:
        """Insert or update feedback for a message."""
        existing = db.query(Feedback).filter(Feedback.message_id == message_id).first()
        if existing:
            existing.vote = vote
            existing.comment = comment
            db.commit()
            db.refresh(existing)
            return existing

        fb = Feedback(message_id=message_id, user_id=user_id, vote=vote, comment=comment)
        db.add(fb)
        db.commit()
        db.refresh(fb)
        return fb

    @staticmethod
    def get_by_message(db: Session, message_id: int) -> Optional[Feedback]:
        return db.query(Feedback).filter(Feedback.message_id == message_id).first()

    @staticmethod
    def get_by_messages(db: Session, message_ids: List[int]) -> List[Feedback]:
        """Bulk fetch feedbacks for multiple message IDs."""
        if not message_ids:
            return []
        return db.query(Feedback).filter(Feedback.message_id.in_(message_ids)).all()

    @staticmethod
    def count_votes(db: Session) -> dict:
        """Count total up/down votes."""
        rows = (
            db.query(Feedback.vote, func.count(Feedback.id))
            .group_by(Feedback.vote)
            .all()
        )
        return {vote: cnt for vote, cnt in rows}

    @staticmethod
    def list_downvoted(db: Session, limit: int = 50, offset: int = 0) -> Tuple[int, List[Feedback]]:
        """List messages that received downvotes (for admin review)."""
        q = db.query(Feedback).filter(Feedback.vote == "down").order_by(Feedback.created_at.desc())
        total = q.count()
        items = q.offset(offset).limit(limit).all()
        return total, items
