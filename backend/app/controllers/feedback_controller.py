# app/controllers/feedback_controller.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import get_current_user
from app.schemas.feedback import FeedbackIn, FeedbackOut
from app.services.feedback_service import FeedbackService

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut)
def submit_feedback(
    body: FeedbackIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit or update feedback (thumbs up/down) for a bot message."""
    svc = FeedbackService(db)
    try:
        fb = svc.submit(body.message_id, current_user.id, body.vote, body.comment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return fb


@router.get("/message/{message_id}", response_model=FeedbackOut)
def get_feedback(
    message_id: int,
    db: Session = Depends(get_db),
):
    """Get feedback for a specific message."""
    svc = FeedbackService(db)
    fb = svc.get_for_message(message_id)
    if not fb:
        raise HTTPException(status_code=404, detail="No feedback for this message")
    return fb


@router.get("/stats")
def feedback_stats(db: Session = Depends(get_db)):
    """Get global feedback vote counts (admin)."""
    svc = FeedbackService(db)
    return svc.stats()
