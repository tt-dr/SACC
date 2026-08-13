from app.main import app


EXPECTED_OPERATIONS = {
    ("GET", "/healthz"),
    ("GET", "/readyz"),
    ("GET", "/api/v1/public/members"),
    ("GET", "/api/v1/public/bootstrap"),
    ("GET", "/api/v1/content"),
    ("GET", "/api/v1/content/{id}"),
    ("POST", "/api/v1/auth/login"),
    ("GET", "/api/v1/admin/me"),
    ("PUT", "/api/v1/admin/password"),
    ("GET", "/api/v1/admin/content"),
    ("POST", "/api/v1/admin/content"),
    ("PUT", "/api/v1/admin/content/reorder"),
    ("PUT", "/api/v1/admin/content/{id}"),
    ("DELETE", "/api/v1/admin/content/{id}"),
    ("POST", "/api/v1/admin/upload"),
    ("GET", "/api/v1/admin/users"),
    ("POST", "/api/v1/admin/users"),
    ("PUT", "/api/v1/admin/users/{id}"),
    ("DELETE", "/api/v1/admin/users/{id}"),
    ("GET", "/api/v1/admin/dashboard"),
    ("GET", "/api/v1/admin/audit-log"),
}


def test_apifox_route_contract() -> None:
    paths = app.openapi()["paths"]
    operations = {
        (method.upper(), path)
        for path, path_item in paths.items()
        for method in path_item
        if method in {"get", "post", "put", "delete", "patch"}
    }
    assert EXPECTED_OPERATIONS <= operations


def test_apifox_wins_on_conflicting_paths() -> None:
    document = app.openapi()
    paths = document["paths"]
    assert "bearerAuth" in document["components"]["securitySchemes"]
    assert "/healthz" in paths
    assert "/readyz" in paths
    assert "put" in paths["/api/v1/admin/content/reorder"]
    assert "/health" not in paths
    assert "/ready" not in paths
    assert "/api/v1/admin/reorder" not in paths


def test_success_responses_use_apifox_result_envelope() -> None:
    document = app.openapi()
    components = document["components"]["schemas"]
    for path, path_item in document["paths"].items():
        for method, operation in path_item.items():
            if method not in {"get", "post", "put", "delete"}:
                continue
            if path in {"/healthz", "/readyz"}:
                continue
            success = operation["responses"].get("200") or operation["responses"].get("201")
            assert success is not None, (method, path)
            schema = success["content"]["application/json"]["schema"]
            result_name = schema["$ref"].rsplit("/", 1)[-1]
            assert {"code", "message", "data"} <= set(
                components[result_name]["properties"]
            )


def test_apifox_user_create_keeps_success_status_200() -> None:
    operation = app.openapi()["paths"]["/api/v1/admin/users"]["post"]
    assert "200" in operation["responses"]
    assert "201" not in operation["responses"]


def test_health_responses_match_raw_apifox_contract() -> None:
    document = app.openapi()
    for path in ("/healthz", "/readyz"):
        schema = document["paths"][path]["get"]["responses"]["200"][
            "content"
        ]["application/json"]["schema"]
        result_name = schema["$ref"].rsplit("/", 1)[-1]
        properties = document["components"]["schemas"][result_name]["properties"]
        assert "status" in properties
        assert "code" not in properties
