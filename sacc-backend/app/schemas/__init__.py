from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


DataT = TypeVar("DataT")


class Result(APIModel, Generic[DataT]):
    """APIfox 统一成功响应包络。"""

    code: int
    message: str
    data: DataT


class MessageResponse(APIModel):
    message: str


EmptyResult = Result[None]


__all__ = ["APIModel", "DataT", "EmptyResult", "MessageResponse", "Result"]
