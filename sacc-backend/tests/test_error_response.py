import json

import pytest
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException

from app.main import http_exception_handler, validation_exception_handler


@pytest.mark.asyncio
async def test_http_error_code_matches_status_code() -> None:
    response = await http_exception_handler(
        None,
        HTTPException(status_code=400, detail="内容不存在"),
    )
    assert response.status_code == 400
    assert json.loads(response.body) == {
        "code": 400,
        "message": "内容不存在",
        "data": None,
    }


@pytest.mark.asyncio
async def test_validation_error_uses_unified_envelope() -> None:
    error = RequestValidationError(
        [
            {
                "type": "missing",
                "loc": ("body", "title"),
                "msg": "Field required",
                "input": {},
            }
        ]
    )
    response = await validation_exception_handler(None, error)
    body = json.loads(response.body)
    assert response.status_code == body["code"] == 400
    assert body["message"] == "Field required"
    assert body["data"] is None
