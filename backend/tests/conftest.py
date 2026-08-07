"""Pytest fixtures for the Skate Club backend tests."""
from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Ensure all tests have required environment variables set."""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("WEBHOOK_SECRET", "test-webhook-secret-32chars-long!!")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("ENVIRONMENT", "test")


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
