import httpx, asyncio
from app.core.config import settings

async def ask(question: str):
    last_err = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(90.0)) as client:
                r = await client.post(f"{settings.RAG_URL}/rag/query",
                                      json={"question": question})
                r.raise_for_status()
                return r.json()
        except (httpx.ReadTimeout, httpx.ConnectError, httpx.HTTPStatusError) as e:
            last_err = e
            await asyncio.sleep(0.5 * (attempt + 1))
    raise last_err
