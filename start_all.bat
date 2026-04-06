@echo off
echo ==============================
echo 🚀 Starting SIMA-BOT (All Services)
echo ==============================

:: 1) FastAPI backend (port 8000)
start cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 2) RAG API (port 8001) - sesuaikan nama modul bila perlu (api:app)
start cmd /k "cd rag-bot && .venv\Scripts\activate && uvicorn api:app --reload --port 8001"

:: 3) Rasa server (port 5005)
start cmd /k "cd rasa-bot && .venv\Scripts\activate && rasa run --enable-api --cors \"*\" --debug --port 5005"

:: 4) Rasa actions (port 5055)
start cmd /k "cd rasa-bot && .venv\Scripts\activate && rasa run actions --port 5055"

:: 5) Next.js frontend (port 3000)
start cmd /k "cd frontend && npm run dev"

echo ==============================
echo ✅ All services started!
echo ==============================
pause
