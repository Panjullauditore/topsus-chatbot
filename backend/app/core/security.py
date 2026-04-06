#app/core/security.py
from passlib.context import CryptContext
from jose import jwt , JWTError
from datetime import datetime, timedelta, timezone
from .config import settings
from fastapi import HTTPException

_pwd = CryptContext(schemes=["argon2"], deprecated="auto")
ALGORITHM = "HS256"


def hash_pw(password: str) -> str:
    return _pwd.hash(password)

def verify_pw(plain_password: str, hashed_password: str) -> bool:
    return _pwd.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_minutes: int = 60 * 12):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")