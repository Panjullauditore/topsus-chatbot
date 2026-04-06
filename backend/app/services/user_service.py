# app/services/user_service.py
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.user_repo import UserRepository
from app.core.security import hash_pw
from app.models.user import User, Role

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def list(self, q: Optional[str], limit: int, offset: int) -> Tuple[int, List[User]]:
        total = UserRepository.count(self.db, q=q)
        items = UserRepository.list(self.db, q=q, limit=limit, offset=offset)
        return total, items

    def get(self, user_id: int) -> Optional[User]:
        return UserRepository.by_id(self.db, user_id)

    def create(self, *, username: str, email: str, password: str, role: Role) -> User:
        pw_hash = hash_pw(password)
        return UserRepository.create(self.db, username=username, email=email, password_hash=pw_hash, role=role)

    def update(
        self, user: User, *, username: Optional[str], email: Optional[str],
        role: Optional[Role], password: Optional[str], avatar: Optional[str]
    ) -> User:
        pw_hash = hash_pw(password) if password else None
        return UserRepository.update(
            self.db, user, username=username, email=email, role=role, password_hash=pw_hash, avatar=avatar
        )

    def delete(self, user: User) -> None:
        UserRepository.delete(self.db, user)
