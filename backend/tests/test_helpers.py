"""Unit tests for tasks/helpers.py."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from tasks.helpers import (
    _DEFAULT_AUTOMATION_PARAMS,
    get_automation_config,
    invalidate_automation_config_cache,
    _CONFIG_CACHE,
)


def test_default_params_coverage():
    expected_ids = {
        "AUTO-01", "AUTO-02", "AUTO-03", "AUTO-04", "AUTO-05",
        "AUTO-06", "AUTO-07", "AUTO-08", "AUTO-09", "AUTO-10",
        "AUTO-11", "AUTO-12", "AUTO-13", "AUTO-14", "AUTO-15",
        "AUTO-16", "AUTO-17", "AUTO-18", "AUTO-19", "AUTO-20",
        "AUTO-21", "AUTO-22", "AUTO-23", "AUTO-24", "AUTO-25",
        "AUTO-26", "AUTO-27", "AUTO-28", "AUTO-29", "AUTO-30",
        "AUTO-31", "AUTO-32", "AUTO-33", "AUTO-34", "AUTO-35",
        "AUTO-36-WA", "AUTO-36-BIL", "AUTO-37",
    }
    assert expected_ids == set(_DEFAULT_AUTOMATION_PARAMS.keys())


def test_get_automation_config_uses_defaults_on_db_error():
    invalidate_automation_config_cache()
    with patch("tasks.helpers.get_supabase", side_effect=Exception("DB unavailable")):
        config = get_automation_config("AUTO-01")
    assert config["enabled"] is True
    assert config["custom_params"]["days_ahead"] == 1


def test_get_automation_config_returns_enabled_true_by_default():
    invalidate_automation_config_cache()
    mock_db = MagicMock()
    q = MagicMock()
    q.select.return_value = q
    q.eq.return_value = q
    q.maybe_single.return_value = q
    q.execute.return_value = MagicMock(data=None)
    mock_db.table.return_value = q
    with patch("tasks.helpers.get_supabase", return_value=mock_db):
        config = get_automation_config("AUTO-08")
    assert config["enabled"] is True
    assert config["custom_params"]["days_warning"] == 30
    assert config["custom_params"]["days_critical"] == 60
    assert config["custom_params"]["days_urgent"] == 90


def test_get_automation_config_reads_db_overrides():
    invalidate_automation_config_cache()
    mock_db = MagicMock()
    q = MagicMock()
    q.select.return_value = q
    q.eq.return_value = q
    q.maybe_single.return_value = q
    q.execute.return_value = MagicMock(data={
        "enabled": False,
        "schedule_hour": 10,
        "schedule_minute": 30,
        "custom_params": {"days_warning": 45},
    })
    mock_db.table.return_value = q
    with patch("tasks.helpers.get_supabase", return_value=mock_db):
        config = get_automation_config("AUTO-08")
    assert config["enabled"] is False
    assert config["schedule_hour"] == 10
    assert config["schedule_minute"] == 30
    assert config["custom_params"]["days_warning"] == 45
    assert config["custom_params"]["days_critical"] == 60


def test_get_automation_config_merges_params():
    """DB partial override should merge with defaults, not replace."""
    invalidate_automation_config_cache()
    mock_db = MagicMock()
    q = MagicMock()
    q.select.return_value = q
    q.eq.return_value = q
    q.maybe_single.return_value = q
    q.execute.return_value = MagicMock(data={
        "enabled": True,
        "schedule_hour": None,
        "schedule_minute": None,
        "custom_params": {"days_urgent": 14},
    })
    mock_db.table.return_value = q
    with patch("tasks.helpers.get_supabase", return_value=mock_db):
        config = get_automation_config("AUTO-08")
    assert config["custom_params"]["days_urgent"] == 14
    assert config["custom_params"]["days_warning"] == 30
    assert config["custom_params"]["days_critical"] == 60


def test_cache_is_used_on_second_call():
    invalidate_automation_config_cache()
    call_count = 0

    def counting_supabase():
        nonlocal call_count
        call_count += 1
        raise Exception("DB error")

    with patch("tasks.helpers.get_supabase", side_effect=counting_supabase):
        get_automation_config("AUTO-05")
        get_automation_config("AUTO-05")

    assert call_count == 1


def test_invalidate_single_clears_only_that_key():
    invalidate_automation_config_cache()
    _CONFIG_CACHE["AUTO-01"] = ({"enabled": True, "custom_params": {}}, 9999999999.0)
    _CONFIG_CACHE["AUTO-02"] = ({"enabled": True, "custom_params": {}}, 9999999999.0)
    invalidate_automation_config_cache("AUTO-01")
    assert "AUTO-01" not in _CONFIG_CACHE
    assert "AUTO-02" in _CONFIG_CACHE


def test_invalidate_all_clears_cache():
    _CONFIG_CACHE["AUTO-03"] = ({"enabled": True, "custom_params": {}}, 9999999999.0)
    invalidate_automation_config_cache()
    assert len(_CONFIG_CACHE) == 0


def test_unknown_automation_returns_empty_params():
    invalidate_automation_config_cache()
    with patch("tasks.helpers.get_supabase", side_effect=Exception("DB down")):
        config = get_automation_config("AUTO-UNKNOWN")
    assert config["enabled"] is True
    assert config["custom_params"] == {}
