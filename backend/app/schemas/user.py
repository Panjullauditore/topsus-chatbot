# backend/app/schemas/user.py
# Buat kontrak data untuk request/response.
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    student = "student"

class SignupIn(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.student

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # <- penting utk ORM
    id: int
    username: str
    email: EmailStr
    role: RoleEnum
     # Pydantic v2 pengganti orm_mode=True
    model_config = ConfigDict(from_attributes=True)

class UserCreateIn(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.student

# NEW: partial update
class UserUpdateIn(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    password: Optional[str] = None
    avatar: Optional[str] = None

# NEW: list + pagination (opsional)
class UserListOut(BaseModel):
    total: int
    items: List[UserOut]