"""
Sprint 5 — 35 Automatizaciones Celery Beat
Todos los schedules centralizados aquí. Los imports cargan los tasks en el worker.
"""
from celery.schedules import crontab

from tasks.celery_app import celery_app

# Import all task modules so Celery registers the tasks
import tasks.calendar_tasks   # noqa: F401  AUTO-01 to AUTO-06
import tasks.finance_tasks    # noqa: F401  AUTO-07 to AUTO-11
import tasks.athlete_tasks    # noqa: F401  AUTO-12 to AUTO-15
import tasks.admin_tasks      # noqa: F401  AUTO-16 to AUTO-20
import tasks.marketing_tasks  # noqa: F401  AUTO-21 to AUTO-25
import tasks.reporting_tasks  # noqa: F401  AUTO-26 to AUTO-29
import tasks.security_tasks   # noqa: F401  AUTO-30 to AUTO-35
import tasks.whatsapp_tasks  # noqa: F401  AUTO-36
import tasks.billing_tasks   # noqa: F401  AUTO-36 (billing) AUTO-37


@celery_app.task(name="tasks.health_check")
def health_check() -> dict:
    return {"status": "ok"}


# ── Celery Beat Schedule ─────────────────────────────────────────────────────
# timezone is set to "America/Bogota" in celery_app.py

celery_app.conf.beat_schedule = {

    # ── CALENDAR ─────────────────────────────────────────────────────────────

    # AUTO-01: Recordatorio entrenamiento día siguiente — diario 19:00
    "auto-01-training-reminder-next-day": {
        "task": "tasks.calendar.training_reminder_next_day_dispatch",
        "schedule": crontab(hour=19, minute=0),
    },

    # AUTO-02: Recordatorio 2 horas antes — cada 30 min
    "auto-02-training-reminder-2h": {
        "task": "tasks.calendar.training_reminder_2h_dispatch",
        "schedule": crontab(minute="*/30"),
    },

    # AUTO-03: Detección de huecos en calendario — lunes 08:00
    "auto-03-detect-schedule-gaps": {
        "task": "tasks.calendar.detect_schedule_gaps_dispatch",
        "schedule": crontab(hour=8, minute=0, day_of_week="monday"),
    },

    # AUTO-06: Análisis semanal carga de entrenamiento — viernes 20:00
    "auto-06-weekly-load-analysis": {
        "task": "tasks.calendar.weekly_load_analysis_dispatch",
        "schedule": crontab(hour=20, minute=0, day_of_week="friday"),
    },

    # AUTO-04 y AUTO-05 son event-driven (DB hook / evento de cancelación)
    # Llamar via: handle_absence.delay(athlete_id, session_id)
    #             process_waitlist.delay(session_id, freed_slot_athlete_id)

    # ── FINANCE ──────────────────────────────────────────────────────────────

    # AUTO-07: Recibo automático — event-driven (DB hook post-insert income)
    # Llamar via: generate_payment_receipt.delay(transaction_id)

    # AUTO-08: Alertas cartera morosa — 1ro y 15 de cada mes 09:00
    "auto-08-overdue-payment-alerts-1st": {
        "task": "tasks.finance.overdue_payment_alerts_dispatch",
        "schedule": crontab(hour=9, minute=0, day_of_month="1"),
    },
    "auto-08-overdue-payment-alerts-15th": {
        "task": "tasks.finance.overdue_payment_alerts_dispatch",
        "schedule": crontab(hour=9, minute=0, day_of_month="15"),
    },

    # AUTO-09: Cierre de caja diario — 22:00
    "auto-09-daily-cash-close": {
        "task": "tasks.finance.daily_cash_close_dispatch",
        "schedule": crontab(hour=22, minute=0),
    },

    # AUTO-10: Proyección financiera mensual — días 28-31 a las 18:00
    # La tarea verifica internamente si es el último día del mes.
    "auto-10-monthly-financial-projection": {
        "task": "tasks.finance.monthly_financial_projection_dispatch",
        "schedule": crontab(hour=18, minute=0, day_of_month="28,29,30,31"),
    },

    # AUTO-11: Renovación membresía — diario 08:00
    "auto-11-membership-renewal-reminder": {
        "task": "tasks.finance.membership_renewal_reminder_dispatch",
        "schedule": crontab(hour=8, minute=0),
    },

    # ── ATHLETES ─────────────────────────────────────────────────────────────

    # AUTO-12: Seguimiento post-competencia — event-driven (DB hook)
    # Llamar via: post_competition_followup.delay(result_id)

    # AUTO-13: Recordatorio evaluación semestral — semanal lunes 10:00
    "auto-13-evaluation-reminder": {
        "task": "tasks.athlete.evaluation_reminder_dispatch",
        "schedule": crontab(hour=10, minute=0, day_of_week="monday"),
    },

    # AUTO-14: Protocolo lesión — event-driven (DB hook post-insert medical_sessions)
    # Llamar via: injury_protocol.delay(medical_session_id)

    # AUTO-15: Monitoreo progreso semanal — lunes 07:00
    "auto-15-weekly-progress-monitor": {
        "task": "tasks.athlete.weekly_progress_monitor_dispatch",
        "schedule": crontab(hour=7, minute=0, day_of_week="monday"),
    },

    # ── ADMIN ─────────────────────────────────────────────────────────────────

    # AUTO-16: Briefing matutino — lun–vie 07:30
    "auto-16-morning-briefing": {
        "task": "tasks.admin.morning_briefing_dispatch",
        "schedule": crontab(hour=7, minute=30, day_of_week="monday-friday"),
    },

    # AUTO-17: Resumen fin de día — lun–sáb 21:00
    "auto-17-end-of-day-summary": {
        "task": "tasks.admin.end_of_day_summary_dispatch",
        "schedule": crontab(hour=21, minute=0, day_of_week="monday-saturday"),
    },

    # AUTO-18: Documentos vencidos — diario 09:00
    "auto-18-expiring-documents-check": {
        "task": "tasks.admin.expiring_documents_check_dispatch",
        "schedule": crontab(hour=9, minute=0),
    },

    # AUTO-19: Control inventario — lunes 06:00
    "auto-19-equipment-inventory-check": {
        "task": "tasks.admin.equipment_inventory_check_dispatch",
        "schedule": crontab(hour=6, minute=0, day_of_week="monday"),
    },

    # AUTO-20: Documentos nuevo atleta — event-driven (post-insert athletes)
    # Llamar via: new_athlete_documents.delay(athlete_id)

    # ── MARKETING ──────────────────────────────────────────────────────────

    # AUTO-21: Felicitaciones cumpleaños — diario 07:00
    # Multi-tenant: Beat llama al "_dispatch", que abanica una corrida real
    # (tasks.marketing.birthday_greetings) por cada club activo.
    "auto-21-birthday-greetings": {
        "task": "tasks.marketing.birthday_greetings_dispatch",
        "schedule": crontab(hour=7, minute=0),
    },

    # AUTO-22: Reactivación inactivos — quincena (1ro y 15) 10:00
    "auto-22-reactivate-inactive-1st": {
        "task": "tasks.marketing.reactivate_inactive_athletes_dispatch",
        "schedule": crontab(hour=10, minute=0, day_of_month="1"),
    },
    "auto-22-reactivate-inactive-15th": {
        "task": "tasks.marketing.reactivate_inactive_athletes_dispatch",
        "schedule": crontab(hour=10, minute=0, day_of_month="15"),
    },

    # AUTO-23: Encuesta satisfacción — trimestral día 1 de ene/abr/jul/oct
    "auto-23-satisfaction-survey-quarterly": {
        "task": "tasks.marketing.satisfaction_survey_dispatch",
        "schedule": crontab(hour=10, minute=0, day_of_month="1", month_of_year="1,4,7,10"),
    },

    # AUTO-24: Solicitud testimonio — event-driven (24h después de resultado top-3),
    # club_id se deriva del atleta del resultado, no necesita dispatch por club.
    # Llamar via: request_testimonial.apply_async(args=[result_id], countdown=86400)

    # AUTO-25: Campaña pre-inscripción — 1ro de octubre 09:00
    "auto-25-season-enrollment-campaign": {
        "task": "tasks.marketing.season_enrollment_campaign_dispatch",
        "schedule": crontab(hour=9, minute=0, day_of_month="1", month_of_year="10"),
    },

    # ── REPORTING ───────────────────────────────────────────────────────────

    # AUTO-26: Reporte semanal directivo — domingos 20:00
    "auto-26-weekly-executive-report": {
        "task": "tasks.reporting.weekly_executive_report_dispatch",
        "schedule": crontab(hour=20, minute=0, day_of_week="sunday"),
    },

    # AUTO-27: Reporte mensual rendimiento — 1ro de cada mes 08:00
    "auto-27-monthly-performance-report": {
        "task": "tasks.reporting.monthly_performance_report_dispatch",
        "schedule": crontab(hour=8, minute=0, day_of_month="1"),
    },

    # AUTO-28: Documentación federativa — 1ro de agosto 09:00
    "auto-28-federation-inscription-report": {
        "task": "tasks.reporting.federation_inscription_report_dispatch",
        "schedule": crontab(hour=9, minute=0, day_of_month="1", month_of_year="8"),
    },

    # AUTO-29: Análisis predictivo — domingos 23:00
    "auto-29-predictive-analysis": {
        "task": "tasks.reporting.predictive_analysis_dispatch",
        "schedule": crontab(hour=23, minute=0, day_of_week="sunday"),
    },

    # ── SECURITY ────────────────────────────────────────────────────────────

    # AUTO-30: Accesos sospechosos — event-driven (Auth hook)
    # Llamar via: check_suspicious_access.delay(user_id, ip_address, success)

    # AUTO-31: Verificación backups — diario 03:00
    "auto-31-verify-backup": {
        "task": "tasks.security.verify_backup",
        "schedule": crontab(hour=3, minute=0),
    },

    # AUTO-32: Auditoría datos sensibles — domingos 04:00
    "auto-32-sensitive-data-audit": {
        "task": "tasks.security.sensitive_data_audit_dispatch",
        "schedule": crontab(hour=4, minute=0, day_of_week="sunday"),
    },

    # AUTO-33: Rotación sesiones inactivas — diario 02:00
    "auto-33-rotate-inactive-sessions": {
        "task": "tasks.security.rotate_inactive_sessions_dispatch",
        "schedule": crontab(hour=2, minute=0),
    },

    # AUTO-34: Notificaciones realtime — event-driven
    # Llamar via: realtime_event_dispatcher.delay(event_type, payload)

    # AUTO-35: Resumen actividad agentes — diario 23:30
    "auto-35-daily-agent-activity-summary": {
        "task": "tasks.security.daily_agent_activity_summary_dispatch",
        "schedule": crontab(hour=23, minute=30),
    },

    # ── WHATSAPP ─────────────────────────────────────────────────────────────

    # AUTO-36: Frase motivadora diaria por WhatsApp — 08:30 todos los días
    # Requiere TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
    "auto-36-daily-whatsapp-motivation": {
        "task": "tasks.whatsapp.send_daily_motivational_dispatch",
        "schedule": crontab(hour=8, minute=30),
    },

    # ── BILLING ──────────────────────────────────────────────────────────────

    # AUTO-36 (billing): Generación de cuotas mensuales — 1ro de cada mes 07:00
    "auto-billing-generate-monthly-fees": {
        "task": "tasks.billing.generate_monthly_fees_dispatch",
        "schedule": crontab(hour=7, minute=0, day_of_month="1"),
    },

    # AUTO-37: Recordatorios de pago diarios — 09:00
    "auto-billing-invoice-reminder": {
        "task": "tasks.billing.send_invoice_reminder_dispatch",
        "schedule": crontab(hour=9, minute=0),
    },
}
