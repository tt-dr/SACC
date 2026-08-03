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
