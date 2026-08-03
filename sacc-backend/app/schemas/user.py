from datetime import datetime
from enum import Enum

from pydantic import Field

from app.schemas import APIModel
from app.schemas.auth import UserRole


class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class UserItem(APIModel):
    id: int
    username: str
    display_name: str | None = None
    avatar: str | None = None
    role: UserRole
    position: str | None = None
    desc: str | None = None
    status: UserStatus
    created_at: datetime


class UserListResponse(APIModel):
    data: list[UserItem]


class CreateUserRequest(APIModel):
    username: str = Field(min_length=1, max_length=64)
    display_name: str | None = Field(default=None, max_length=64)
    password: str = Field(min_length=6)
    role: UserRole = UserRole.EDITOR
    position: str | None = Field(default=None, max_length=64)
    desc: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=255)


class UpdateUserRequest(APIModel):
    username: str | None = Field(default=None, min_length=1, max_length=64)
    display_name: str | None = Field(default=None, max_length=64)
    password: str | None = Field(default=None, min_length=6)
    role: UserRole | None = None
    position: str | None = Field(default=None, max_length=64)
    desc: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=255)

