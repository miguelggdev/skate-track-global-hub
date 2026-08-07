"""Unit tests for the webhook validation logic."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient


def _make_app():
    from main import app
    return app


def test_webhook_without_secret_header_returns_401():
    with patch("config.settings") as mock_settings:
        mock_settings.webhook_secret = "real-secret"
        mock_settings.environment = "test"
        mock_settings.frontend_url = "http://localhost:5173"
        from api.routes.webhooks import _verify
        with pytest.raises(HTTPException) as exc:
            _verify(None)
        assert exc.value.status_code == 401


def test_webhook_wrong_secret_returns_401():
    with patch("config.settings") as mock_settings:
        mock_settings.webhook_secret = "real-secret"
        from api.routes.webhooks import _verify
        with pytest.raises(HTTPException) as exc:
            _verify("wrong-secret")
        assert exc.value.status_code == 401


def test_webhook_correct_secret_does_not_raise():
    with patch("config.settings") as mock_settings:
        mock_settings.webhook_secret = "real-secret"
        from api.routes.webhooks import _verify
        _verify("real-secret")


def test_webhook_unconfigured_server_returns_503():
    with patch("config.settings") as mock_settings:
        mock_settings.webhook_secret = ""
        from api.routes.webhooks import _verify
        with pytest.raises(HTTPException) as exc:
            _verify("any-secret")
        assert exc.value.status_code == 503
