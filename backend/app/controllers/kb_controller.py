# app/controllers/kb_controller.py
"""
Admin endpoints for Knowledge Base and Prompt management.
"""
import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Prompt file path ---
PROMPT_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "prompt_config.json")


class PromptBody(BaseModel):
    prompt: str


def _load_prompt() -> str | None:
    """Load saved prompt from file."""
    try:
        if os.path.exists(PROMPT_FILE):
            with open(PROMPT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("prompt")
    except Exception:
        pass
    return None


def _save_prompt(prompt: str):
    """Save prompt to file."""
    with open(PROMPT_FILE, "w", encoding="utf-8") as f:
        json.dump({"prompt": prompt}, f, ensure_ascii=False, indent=2)


@router.get("/prompt")
def get_prompt():
    """Get the current RAG system prompt."""
    prompt = _load_prompt()
    return {"prompt": prompt}


@router.put("/prompt")
def update_prompt(body: PromptBody):
    """Update the RAG system prompt."""
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    if "{context}" not in body.prompt or "{question}" not in body.prompt:
        raise HTTPException(
            status_code=400,
            detail="Prompt must contain {context} and {question} variables"
        )
    _save_prompt(body.prompt)
    return {"ok": True, "message": "Prompt saved successfully"}
