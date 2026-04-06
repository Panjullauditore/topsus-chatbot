#app/core/config.py
#explain :
#This configuration setup is particularly useful for 
# applications that need to adapt to different environments. 

import os
import dotenv
from pathlib import Path    
from pydantic import BaseModel

ENV_PATH = Path(__file__).parent.parent.parent / ".env" 
dotenv.load_dotenv(dotenv_path=ENV_PATH)

def split_env_list(value: str | None) -> list[str]:
    """Helper untuk memecah string .env jadi list bersih"""
    if not value:
        return []
    return [v.strip().strip('"').strip("'") for v in value.split(",") if v.strip()]

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-change-this")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    BACKEND_CORS_ORIGINS: list[str] = split_env_list(os.getenv("BACKEND_CORS_ORIGINS"))
    ENV: str = os.getenv("ENV", "dev")
    COOKIE_NAME: str = os.getenv("COOKIE_NAME", "access_token")
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    RASA_URL: str | None = os.getenv("RASA_URL")
    RAG_URL: str | None = os.getenv("RAG_URL")
    RASA_THRESHOLD: float = float(os.getenv("RASA_THRESHOLD", "0.7"))


settings = Settings()