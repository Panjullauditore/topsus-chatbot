# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv



load_dotenv()

from app.core.config import settings
from app.core.db import Base, engine
from app.models import user, chat, feedback  # pastikan model terimport
from app.controllers.auth_controller import router as auth_router
from app.controllers.chat_controller import router as chat_router
from app.controllers import user_controller
from app.controllers.feedback_controller import router as feedback_router
from app.controllers.kb_controller import router as kb_router

app = FastAPI(title="SIMA-BOT FSM")


Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # hardcode dulu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type"],
)


@app.get("/")
def health():
    return {"ok": True}

# Routes
app.include_router(auth_router)
app.include_router(chat_router) 
app.include_router(user_controller.router)
app.include_router(feedback_router)
app.include_router(kb_router)