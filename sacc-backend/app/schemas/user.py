from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import Field, RootModel, StringConstraints, field_validator

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


class UserListResponse(RootModel[list[UserItem]]):
    """APIfox 用户列表的 data 类型。"""


class CreateUserRequest(APIModel):
    # 先去除首尾空白，再按去除后的长度校验（1~64），不做大小写转换。
    username: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=64),
    ]
    display_name: str | None = Field(default=None, max_length=64)
    password: str = Field(min_length=6)
    role: UserRole = UserRole.EDITOR
    position: str | None = Field(default=None, max_length=64)
    desc: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=255)

    @field_validator("password")
    @classmethod
    def password_within_bcrypt_byte_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("密码过长：bcrypt 仅支持 72 字节以内的密码")
        return value


class UpdateUserRequest(APIModel):
    username: str | None = Field(default=None, min_length=1, max_length=64)
    display_name: str | None = Field(default=None, max_length=64)
    password: str | None = Field(default=None, min_length=6)
    role: UserRole | None = None
    position: str | None = Field(default=None, max_length=64)
    desc: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=255)
