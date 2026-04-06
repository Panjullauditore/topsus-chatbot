#app/repositories/user_repo.py
#CRUD Spesifik User 

from sqlalchemy.orm import Session
from app.models.user import User, Role
from typing import Optional, List, Tuple
from sqlalchemy import select, or_, func

class UserRepository:
    @staticmethod
    #buat nyari satu user berdasarkan email
    def by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def search_by_email(db: Session, email_part: str) -> List[User]:
        # Mencari email yang mengandung email_part (Case Insensitive)
        qq = f"%{email_part.lower()}%"
        return db.query(User).filter(func.lower(User.email).like(qq)).all()

    @staticmethod
    def by_id(db: Session, user_id: int) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create(db:Session, *, username: str, email: str, password_hash: str, role: Role) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
# NEW: list + count (optional search q)
    @staticmethod
    def list(
        db: Session, *, q: Optional[str] = None, limit: int = 20, offset: int = 0
    ) -> List[User]:
        stmt = select(User).order_by(User.id.desc())
        if q:
            qq = f"%{q.lower()}%"
            stmt = stmt.where(or_(func.lower(User.username).like(qq), func.lower(User.email).like(qq)))
        stmt = stmt.limit(limit).offset(offset)
        return list(db.execute(stmt).scalars())

    @staticmethod
    def count(db: Session, *, q: Optional[str] = None) -> int:
        stmt = select(func.count()).select_from(User)
        if q:
            qq = f"%{q.lower()}%"
            stmt = stmt.where(or_(func.lower(User.username).like(qq), func.lower(User.email).like(qq)))
        return db.execute(stmt).scalar_one()

    # NEW: update field2 opsional
    @staticmethod
    def update(
        db: Session, user: User, *, username: Optional[str] = None,
        email: Optional[str] = None, role: Optional[Role] = None,
        password_hash: Optional[str] = None, avatar: Optional[str] = None
    ) -> User:
        if username is not None: user.username = username
        if email is not None: user.email = email
        if role is not None: user.role = role
        if password_hash is not None: user.password_hash = password_hash
        if avatar is not None: user.avatar = avatar
        db.commit(); db.refresh(user)
        return user

    # NEW: delete
    @staticmethod
    def delete(db: Session, user: User) -> None:
        db.delete(user); db.commit()