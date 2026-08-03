from enum import Enum

from pydantic import Field

from app.schemas import APIModel


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    EDITOR = "editor"


class LoginRequest(APIModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1)


class AuthUser(APIModel):
    user_id: int
    username: str
    display_name: str
    role: UserRole
    position: str | None = None
    desc: str | None = None
    avatar: str | None = None


class LoginData(AuthUser):
    token: str
    expires_in: int = 43_200


class LoginResponse(APIModel):
    data: LoginData


class ChangePasswordRequest(APIModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6)


class MeResponse(APIModel):
    data: AuthUser

