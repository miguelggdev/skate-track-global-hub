"""Tests para el panel de automatizaciones (/api/automations)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

from tests.conftest import override_user


def test_list_denies_non_privileged(api_client):
    app, client = api_client
    override_user(app, sub="athlete-1")
    with patch("api.routes.automations._fetch_role_and_club_async", new=AsyncMock(return_value=("athlete", "club-1"))):
        res = client.get("/api/automations")
    assert res.status_code == 403


def test_list_allows_admin(api_client, mock_supabase):
    app, client = api_client
    override_user(app, sub="admin-1")
    with patch("api.routes.automations._fetch_role_and_club_async", new=AsyncMock(return_value=("admin", "club-1"))), \
         patch("api.routes.automations.get_supabase", return_value=mock_supabase):
        res = client.get("/api/automations")
    assert res.status_code == 200
    assert "automations" in res.json()


def test_logs_rejects_invalid_status(api_client):
    app, client = api_client
    override_user(app, sub="admin-1")
    with patch("api.routes.automations._fetch_role_and_club_async", new=AsyncMock(return_value=("admin", "club-1"))):
        res = client.get("/api/automations/logs", params={"status": "bogus"})
    assert res.status_code == 422


def test_patch_denies_non_admin(api_client):
    app, client = api_client
    override_user(app, sub="leader-1")
    # Un leader puede VER pero no MODIFICAR
    with patch("api.routes.automations._fetch_role_and_club_async", new=AsyncMock(return_value=("leader", "club-1"))):
        res = client.patch("/api/automations/AUTO-01", json={"enabled": False})
    assert res.status_code == 403


def test_patch_unknown_automation_returns_404(api_client):
    app, client = api_client
    override_user(app, sub="admin-1")
    with patch("api.routes.automations._fetch_role_and_club_async", new=AsyncMock(return_value=("admin", "club-1"))):
        res = client.patch("/api/automations/AUTO-999", json={"enabled": False})
    assert res.status_code == 404
