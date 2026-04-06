#app/services/auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import verify_pw, create_access_token, hash_pw
from app.repositories.user_repo import UserRepository
from app.models.user import Role

class AuthService:
    @staticmethod
    def signup(db: Session, username: str, email: str, password: str, role: Role):
       if UserRepository.by_email(db, email):
           raise HTTPException(status_code=400, detail="Email already registered")
       password_hash = hash_pw(password)
       user = UserRepository.create(
           db,
           username=username,
           email=email,
           password_hash=password_hash,
           role=role
       )
       return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> str:
        user = UserRepository.by_email(db, email)
        if not user or not verify_pw(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Maaf, email atau password salah")
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        return user, token