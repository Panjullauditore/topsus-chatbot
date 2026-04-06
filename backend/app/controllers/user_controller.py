# app/controllers/user_controller.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.user import Role as DBRole
from app.schemas.user import UserOut, UserCreateIn, UserUpdateIn, UserListOut, RoleEnum
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=UserListOut)
def list_users(
    q: Optional[str] = Query(None, description="Search username/email"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    svc = UserService(db)
    total, items = svc.list(q=q, limit=limit, offset=offset)
    return UserListOut(total=total, items=[UserOut.model_validate(u) for u in items])

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    svc = UserService(db)
    user = svc.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)

@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreateIn, db: Session = Depends(get_db)):
    svc = UserService(db)
    role = DBRole(body.role.value) if isinstance(body.role, RoleEnum) else DBRole(body.role)
    user = svc.create(username=body.username, email=body.email, password=body.password, role=role)
    return UserOut.model_validate(user)

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdateIn, db: Session = Depends(get_db)):
    svc = UserService(db)
    user = svc.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = DBRole(body.role.value) if body.role is not None else None
    updated = svc.update(
        user,
        username=body.username,
        email=body.email,
        role=role,
        password=body.password,
        avatar=body.avatar,
    )
    return UserOut.model_validate(updated)

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    svc = UserService(db)
    user = svc.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    svc.delete(user)
    return
