# app/controllers/auth_controller.py
from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.config import settings
from app.schemas.user import SignupIn, LoginIn, UserOut ,RoleEnum
from app.services.auth_service import AuthService
from app.core.deps import get_current_user
from app.models.user import User
from app.models.user import Role as DBRole
from app.schemas.user import UserOut , RoleEnum , SignupIn ,  LoginIn
from app.repositories.user_repo import UserRepository


router = APIRouter(prefix="/auth", tags=["auth"])

def _cookie_params():
    # dev: http only, aman untuk localhost
    return dict(
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=60 * 60 * 12,  # tambahin biar ada masa berlaku 12 jam
    ) if settings.ENV == "dev" else dict(
        httponly=True,
        samesite="none",
        secure=True,
        path="/",
        max_age=60 * 60 * 12,
    )


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    db_role = DBRole(body.role.value) if isinstance(body.role, RoleEnum) else DBRole(body.role)
    user = AuthService.signup(
        db=db,
        username=body.username,            # <-- perbaiki ini
        email=body.email,
        password=body.password,
        role=db_role
    )
    return user.UserOut.model_validate(user)

@router.post("/login", response_model=UserOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    # AuthService.login balikin (user, token)
    user, token = AuthService.login(db, email=body.email, password=body.password)

    # bikin output schema
    user_out = UserOut.model_validate(user)

    # BANGUN response sendiri, bukan return UserOut langsung
    resp = JSONResponse(content=user_out.model_dump())
    resp.set_cookie(settings.COOKIE_NAME, token, **_cookie_params())  # cookie pasti nempel
    return resp

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(settings.COOKIE_NAME, path="/")
    return {"ok": True}