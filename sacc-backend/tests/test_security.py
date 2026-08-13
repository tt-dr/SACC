from jose import JWTError
import pytest

from app.utils.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_round_trip() -> None:
    password_hash = hash_password("correct horse battery staple")
    assert password_hash != "correct horse battery staple"
    assert verify_password("correct horse battery staple", password_hash)
    assert not verify_password("wrong password", password_hash)


def test_password_longer_than_bcrypt_limit_is_rejected() -> None:
    with pytest.raises(ValueError, match="72"):
        hash_password("a" * 73)


def test_access_token_has_required_claims() -> None:
    token = create_access_token("42", {"role": "editor"})
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "editor"
    assert payload["jti"]
    assert payload["exp"] > payload["iat"]


def test_custom_claims_cannot_override_token_identity() -> None:
    token = create_access_token("42", {"sub": "7", "jti": "fixed"})
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["jti"] != "fixed"


def test_invalid_access_token_is_rejected() -> None:
    with pytest.raises(JWTError):
        decode_access_token("not-a-token")
