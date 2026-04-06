from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from datetime import datetime
import enum
from ..core.db import Base

class Role(str, enum.Enum):
    admin = "admin"
    student = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum(Role), default=Role.student, nullable=False)
    avatar = Column(String(250), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)