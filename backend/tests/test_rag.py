"""Tests para las rutas RAG (/api/rag) — autorización y validaciones."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

from tests.conftest import override_user


def test_list_documents_ok(api_client, mock_supabase):
    app, client = api_client
    override_user(app)
    with patch("database.supabase_client.get_supabase", return_value=mock_supabase):
        res = client.get("/api/rag/documents")
    assert res.status_code == 200
    assert "documents" in res.json()


def test_delete_denies_non_admin(api_client):
    app, client = api_client
    override_user(app, sub="athlete-1")
    with patch("api.routes.rag._fetch_app_role_async", new=AsyncMock(return_value="athlete")):
        res = client.delete("/api/rag/documents/some-id")
    assert res.status_code == 403


def test_delete_allows_admin(api_client, mock_supabase):
    app, client = api_client
    override_user(app, sub="admin-1")
    with patch("api.routes.rag._fetch_app_role_async", new=AsyncMock(return_value="admin")), \
         patch("database.supabase_client.get_supabase", return_value=mock_supabase):
        res = client.delete("/api/rag/documents/some-id")
    assert res.status_code == 200
    assert res.json()["deleted"] is True


def test_upload_denies_non_admin(api_client):
    app, client = api_client
    override_user(app, sub="athlete-1")
    with patch("api.routes.rag._fetch_app_role_async", new=AsyncMock(return_value="athlete")):
        res = client.post(
            "/api/rag/upload",
            files={"file": ("doc.txt", b"contenido", "text/plain")},
            data={"title": "Doc", "document_type": "otro"},
        )
    assert res.status_code == 403


def test_upload_rejects_invalid_content_type(api_client):
    app, client = api_client
    override_user(app, sub="admin-1")
    with patch("api.routes.rag._fetch_app_role_async", new=AsyncMock(return_value="admin")):
        res = client.post(
            "/api/rag/upload",
            files={"file": ("img.png", b"\x89PNG\r\n", "image/png")},
            data={"title": "Imagen", "document_type": "otro"},
        )
    assert res.status_code == 400
