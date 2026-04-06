import httpx
from app.core.config import settings

async def nlu_parse(text: str):
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.post(f"{settings.RASA_URL}/model/parse", json={"text": text})
        r.raise_for_status()
        return r.json()

async def reply_via_webhook(sender_id: str, text: str):
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(f"{settings.RASA_URL}/webhooks/rest/webhook",
                              json={"sender": sender_id, "message": text})
        r.raise_for_status()
        return r.json()
