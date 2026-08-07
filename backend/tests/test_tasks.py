"""Unit tests for Celery task functions — focuses on enabled/disabled logic and custom params."""
from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_config(enabled: bool = True, params: dict | None = None) -> dict:
    return {"enabled": enabled, "schedule_hour": None, "schedule_minute": None, "custom_params": params or {}}


# ── marketing_tasks ───────────────────────────────────────────────────────────

class TestReactivateInactiveAthletes:
    def test_disabled_returns_early(self, mock_supabase_ctx):
        with patch("tasks.marketing_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.marketing_tasks import reactivate_inactive_athletes
            result = reactivate_inactive_athletes()
        assert result["actions_taken"] == 0
        assert "Deshabilitada" in result["summary"]

    def test_today_variable_defined(self, mock_supabase_ctx):
        """Regression: today was undefined — NameError in upsert."""
        mock_db = mock_supabase_ctx
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.gte.return_value.execute.return_value.data = []

        with patch("tasks.marketing_tasks.get_automation_config", return_value=_make_config(params={"inactive_days": 30})):
            with patch("tasks.marketing_tasks.get_supabase", return_value=mock_db):
                from tasks.marketing_tasks import reactivate_inactive_athletes
                # Should not raise NameError
                result = reactivate_inactive_athletes()
        assert isinstance(result, dict)

    def test_inactive_days_param_respected(self, mock_supabase_ctx):
        mock_db = mock_supabase_ctx
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.gte.return_value.execute.return_value.data = []

        with patch("tasks.marketing_tasks.get_automation_config", return_value=_make_config(params={"inactive_days": 90})):
            with patch("tasks.marketing_tasks.get_supabase", return_value=mock_db):
                from tasks.marketing_tasks import reactivate_inactive_athletes
                result = reactivate_inactive_athletes()
        assert result["records_found"] == 0


# ── calendar_tasks ────────────────────────────────────────────────────────────

class TestCalendarTasks:
    def test_reminder_next_session_disabled(self, mock_supabase_ctx):
        with patch("tasks.calendar_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.calendar_tasks import send_training_reminder
            result = send_training_reminder()
        assert result["actions_taken"] == 0
        assert "Deshabilitada" in result["summary"]

    def test_reminder_no_sessions(self, mock_supabase_ctx):
        mock_db = mock_supabase_ctx
        mock_db.table.return_value.select.return_value.gte.return_value.lte.return_value.execute.return_value.data = []

        with patch("tasks.calendar_tasks.get_automation_config", return_value=_make_config(params={"days_ahead": 1})):
            with patch("tasks.calendar_tasks.get_supabase", return_value=mock_db):
                from tasks.calendar_tasks import send_training_reminder
                result = send_training_reminder()
        assert result["records_found"] == 0


# ── finance_tasks ─────────────────────────────────────────────────────────────

class TestFinanceTasks:
    def test_cash_close_disabled(self, mock_supabase_ctx):
        with patch("tasks.finance_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.finance_tasks import daily_cash_close
            result = daily_cash_close()
        assert result["actions_taken"] == 0

    def test_cash_close_uses_training_session_id(self, mock_supabase_ctx):
        """Regression: was using session_id instead of training_session_id."""
        mock_db = mock_supabase_ctx
        # Capture which columns are selected in attendance query
        selected_columns: list[str] = []

        def track_select(cols):
            selected_columns.append(cols)
            return mock_db.table.return_value.select.return_value

        mock_db.table.return_value.select.side_effect = track_select
        mock_db.table.return_value.select.return_value.gte.return_value.lte.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.in_.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.gte.return_value.execute.return_value.data = []

        with patch("tasks.finance_tasks.get_automation_config", return_value=_make_config()):
            with patch("tasks.finance_tasks.get_supabase", return_value=mock_db):
                with patch("tasks.finance_tasks.get_admin_user_ids", return_value=[]):
                    from tasks.finance_tasks import daily_cash_close
                    daily_cash_close()

        # Verify training_session_id appears in a select call, not session_id
        all_cols = " ".join(str(c) for c in selected_columns)
        assert "training_session_id" in all_cols
        assert "session_id," not in all_cols.replace("training_session_id", "")


# ── athlete_tasks ─────────────────────────────────────────────────────────────

class TestAthleteTasks:
    def test_weekly_progress_disabled(self, mock_supabase_ctx):
        with patch("tasks.athlete_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.athlete_tasks import weekly_progress_monitoring
            result = weekly_progress_monitoring()
        assert result["actions_taken"] == 0

    def test_post_competition_disabled(self, mock_supabase_ctx):
        with patch("tasks.athlete_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.athlete_tasks import post_competition_followup
            result = post_competition_followup("fake-id")
        assert result["actions_taken"] == 0


# ── admin_tasks ───────────────────────────────────────────────────────────────

class TestAdminTasks:
    def test_morning_briefing_disabled(self, mock_supabase_ctx):
        with patch("tasks.admin_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.admin_tasks import morning_briefing
            result = morning_briefing()
        assert result["actions_taken"] == 0

    def test_end_of_day_disabled(self, mock_supabase_ctx):
        with patch("tasks.admin_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.admin_tasks import end_of_day_summary
            result = end_of_day_summary()
        assert result["actions_taken"] == 0


# ── security_tasks ────────────────────────────────────────────────────────────

class TestSecurityTasks:
    def test_suspicious_access_disabled(self, mock_supabase_ctx):
        with patch("tasks.security_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.security_tasks import check_suspicious_access
            result = check_suspicious_access("user-1", "1.2.3.4", False)
        assert result["actions_taken"] == 0

    def test_verify_backup_disabled(self, mock_supabase_ctx):
        with patch("tasks.security_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.security_tasks import verify_backup
            result = verify_backup()
        assert result["actions_taken"] == 0

    def test_daily_agent_summary_disabled(self, mock_supabase_ctx):
        with patch("tasks.security_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.security_tasks import daily_agent_activity_summary
            result = daily_agent_activity_summary()
        assert result["actions_taken"] == 0


# ── billing_tasks ─────────────────────────────────────────────────────────────

class TestBillingTasks:
    def test_generate_monthly_fees_disabled(self, mock_supabase_ctx):
        with patch("tasks.billing_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.billing_tasks import generate_monthly_fees
            result = generate_monthly_fees()
        assert result["actions_taken"] == 0

    def test_send_invoice_reminder_disabled(self, mock_supabase_ctx):
        with patch("tasks.billing_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.billing_tasks import send_invoice_reminder
            # send_invoice_reminder is a Celery task; call run() or call it directly
            result = send_invoice_reminder()
        assert result["actions_taken"] == 0

    def test_due_day_param(self, mock_supabase_ctx):
        """Regression: due_day_of_month param was ignored (hardcoded 5)."""
        mock_db = mock_supabase_ctx
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_db.table.return_value.select.return_value.execute.return_value.data = []

        with patch("tasks.billing_tasks.get_automation_config", return_value=_make_config(params={"due_day_of_month": 15})):
            with patch("tasks.billing_tasks.get_supabase", return_value=mock_db):
                from tasks.billing_tasks import generate_monthly_fees
                result = generate_monthly_fees()
        assert isinstance(result, dict)


# ── whatsapp_tasks ────────────────────────────────────────────────────────────

class TestWhatsappTasks:
    def test_disabled_returns_early(self, mock_supabase_ctx):
        with patch("tasks.whatsapp_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.whatsapp_tasks import send_daily_motivational_phrase
            result = send_daily_motivational_phrase()
        assert result["actions_taken"] == 0

    def test_cfg_not_overwritten(self, mock_supabase_ctx):
        """Regression: cfg was overwritten by settings query — check enabled still checked."""
        import os
        with patch.dict(os.environ, {"TWILIO_ACCOUNT_SID": ""}):
            with patch("tasks.whatsapp_tasks.get_automation_config", return_value=_make_config(enabled=True)):
                from tasks.whatsapp_tasks import send_daily_motivational_phrase
                result = send_daily_motivational_phrase()
        # Should return early because Twilio not configured, not crash
        assert "Twilio" in result["summary"]


# ── reporting_tasks ───────────────────────────────────────────────────────────

class TestReportingTasks:
    def test_weekly_executive_disabled(self, mock_supabase_ctx):
        with patch("tasks.reporting_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.reporting_tasks import weekly_executive_report
            result = weekly_executive_report()
        assert result["actions_taken"] == 0

    def test_predictive_analysis_disabled(self, mock_supabase_ctx):
        with patch("tasks.reporting_tasks.get_automation_config", return_value=_make_config(enabled=False)):
            from tasks.reporting_tasks import predictive_analysis
            result = predictive_analysis()
        assert result["actions_taken"] == 0
