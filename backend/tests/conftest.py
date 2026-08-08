"""Pytest fixtures for the Skate Club backend tests."""
from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

# ── Variables de entorno para tests ──────────────────────────────────────────
# Se fijan A NIVEL DE MÓDULO (conftest se importa antes de recolectar los tests)
# porque `config.py` instancia `Settings()` al importarse, durante la
# recolección — antes de que corra cualquier fixture. `setdefault` respeta un
# valor real si ya existe en el entorno.
_TEST_ENV = {
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_SERVICE_KEY": "test-service-key",
    "SUPABASE_JWT_SECRET": "test-jwt-secret",
    "ANTHROPIC_API_KEY": "test-anthropic-key",
    "RESEND_API_KEY": "",
    "WEBHOOK_SECRET": "test-webhook-secret-32chars-long!!",
    "REDIS_URL": "redis://localhost:6379/0",
    "ENVIRONMENT": "test",
}
for _k, _v in _TEST_ENV.items():
    os.environ.setdefault(_k, _v)


@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Ensure all tests have required environment variables set."""
    for _key, _val in _TEST_ENV.items():
        monkeypatch.setenv(_key, _val)


@pytest.fixture
def mock_supabase():
    """Return a MagicMock supabase client with chainable query methods."""
    mock = MagicMock()
    query = MagicMock()
    query.select.return_value = query
    query.insert.return_value = query
    query.update.return_value = query
    query.upsert.return_value = query
    query.delete.return_value = query
    query.eq.return_value = query
    query.neq.return_value = query
    query.gte.return_value = query
    query.lte.return_value = query
    query.lt.return_value = query
    query.gt.return_value = query
    query.in_.return_value = query
    query.ilike.return_value = query
    query.order.return_value = query
    query.limit.return_value = query
    query.maybe_single.return_value = query
    query.execute.return_value = MagicMock(data=[], count=0)
    mock.table.return_value = query
    return mock


@pytest.fixture
def mock_supabase_ctx(mock_supabase):
    """Patch get_supabase() globally for the duration of the test."""
    with patch("database.supabase_client.get_supabase", return_value=mock_supabase):
        with patch("tasks.helpers.get_supabase", return_value=mock_supabase):
            yield mock_supabase


@pytest.fixture
def api_client():
    """FastAPI app + TestClient. Limpia los dependency_overrides al terminar.

    No se usa como context manager para no disparar los eventos de startup
    (que en producción validan CORS/webhook_secret).
    """
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    yield app, client
    app.dependency_overrides.clear()


def override_user(app, sub: str = "user-1"):
    """Sobrescribe get_current_user para simular un usuario autenticado."""
    from api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"sub": sub}
