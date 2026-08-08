"""Tests para las rutas de agentes IA (/api/agents)."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import override_user


def test_list_agents_returns_all_13_including_new(api_client):
    app, client = api_client
    override_user(app)
    res = client.get("/api/agents/")
    assert res.status_code == 200
    agents = res.json()["agents"]
    assert len(agents) == 13
    ids = {a["id"] for a in agents}
    # Los 3 agentes del Sprint 13 deben estar expuestos
    assert {"security", "operations", "legal"} <= ids


def test_unknown_agent_returns_404(api_client):
    app, client = api_client
    override_user(app)
    with patch("api.routes.agents._get_registry", return_value={"skating": MagicMock()}):
        res = client.post("/api/agents/noexiste/chat", json={"message": "hola", "history": []})
    assert res.status_code == 404


def test_restricted_agent_denies_non_privileged_role(api_client):
    app, client = api_client
    override_user(app, sub="athlete-1")
    agent = MagicMock()
    agent.chat = AsyncMock(return_value="no debería llegar")
    with patch("api.routes.agents._get_registry", return_value={"security": agent}), \
         patch("api.routes.agents._fetch_app_role_async", new=AsyncMock(return_value="athlete")):
        res = client.post("/api/agents/security/chat", json={"message": "hola", "history": []})
    assert res.status_code == 403
    agent.chat.assert_not_called()


def test_restricted_agent_allows_admin(api_client):
    app, client = api_client
    override_user(app, sub="admin-1")
    agent = MagicMock()
    agent.chat = AsyncMock(return_value="respuesta del agente")
    with patch("api.routes.agents._get_registry", return_value={"security": agent}), \
         patch("api.routes.agents._fetch_app_role_async", new=AsyncMock(return_value="admin")):
        res = client.post("/api/agents/security/chat", json={"message": "hola", "history": []})
    assert res.status_code == 200
    body = res.json()
    assert body["response"] == "respuesta del agente"
    assert body["agent_id"] == "security"


def test_open_agent_allows_any_role(api_client):
    app, client = api_client
    override_user(app, sub="athlete-1")
    agent = MagicMock()
    agent.chat = AsyncMock(return_value="consejo de patinaje")
    with patch("api.routes.agents._get_registry", return_value={"skating": agent}), \
         patch("api.routes.agents._fetch_app_role_async", new=AsyncMock(return_value="athlete")):
        res = client.post("/api/agents/skating/chat", json={"message": "hola", "history": []})
    assert res.status_code == 200
    assert res.json()["response"] == "consejo de patinaje"
