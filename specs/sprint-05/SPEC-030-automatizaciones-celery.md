# SPEC-030 — Sprint 5: 35 Automatizaciones Celery

**Status:** `done`
**Agente:** AG-CLAUDE-BACKEND  
**Sprint:** 5 (Semanas 9-10)

---

## Propósito

Implementar las 35 automatizaciones Celery que eliminan el 70% de las tareas administrativas manuales del club. Las automatizaciones corren como tareas asíncronas con Celery Beat (programadas) y event-driven (disparadas desde el frontend o DB hooks).

---

## Archivos creados/modificados

| Archivo | Descripción |
|---------|-------------|
| `backend/tasks/helpers.py` | Helpers compartidos: `notify_user`, `notify_role`, `log_activity`, `send_email_placeholder` |
| `backend/tasks/calendar_tasks.py` | AUTO-01 a AUTO-06 |
| `backend/tasks/finance_tasks.py` | AUTO-07 a AUTO-11 |
| `backend/tasks/athlete_tasks.py` | AUTO-12 a AUTO-15 (+ `injury_followup`) |
| `backend/tasks/admin_tasks.py` | AUTO-16 a AUTO-20 |
| `backend/tasks/marketing_tasks.py` | AUTO-21 a AUTO-25 |
| `backend/tasks/reporting_tasks.py` | AUTO-26 a AUTO-29 |
| `backend/tasks/security_tasks.py` | AUTO-30 a AUTO-35 |
| `backend/tasks/schedules.py` | Beat schedule completo, todos los 35 schedules |
| `backend/tasks/celery_app.py` | `include` actualizado con todos los módulos |
| `supabase/migrations/20260802200000_sprint5_automations_tables.sql` | 10 tablas nuevas + 2 columnas en `athletes` |

---

## Tablas nuevas en Supabase

| Tabla | Usada por |
|-------|-----------|
| `notification_log` | Log de notificaciones enviadas (canal, destinatario, estado) |
| `agent_activity_log` | Trazabilidad de ejecuciones (status, records, actions) |
| `attendance_alerts` | AUTO-04: alertas de inasistencias consecutivas |
| `daily_reports` | AUTO-09: cierres de caja diarios |
| `backup_log` | AUTO-31: verificaciones de backup |
| `retention_campaigns` | AUTO-22: campañas de reactivación |
| `satisfaction_surveys` | AUTO-23: encuestas NPS trimestrales |
| `athlete_testimonials` | AUTO-24: testimonios post-logro |
| `athlete_performance_predictions` | AUTO-29: predicciones semanales |
| `federation_documents` | AUTO-28: documentación federativa |

Columnas nuevas en `athletes`:
- `membership_expires_at date` — para AUTO-11
- `last_evaluation_date date` — para AUTO-13

---

## Catálogo de automatizaciones

### Programadas (Celery Beat)
| AUTO | Task name | Schedule | Descripción |
|------|-----------|----------|-------------|
| 01 | `calendar.training_reminder_next_day` | Diario 19:00 | Recordatorio sesión mañana |
| 02 | `calendar.training_reminder_2h` | Cada 30 min | Recordatorio 2h antes |
| 03 | `calendar.detect_schedule_gaps` | Lunes 08:00 | Huecos en calendario 4 semanas |
| 06 | `calendar.weekly_load_analysis` | Viernes 20:00 | Semáforo carga de entrenamiento |
| 08 | `finance.overdue_payment_alerts` | 1ro y 15 09:00 | Cartera morosa |
| 09 | `finance.daily_cash_close` | Diario 22:00 | Cierre de caja |
| 10 | `finance.monthly_financial_projection` | Días 28-31 18:00 | Proyección 3 meses |
| 11 | `finance.membership_renewal_reminder` | Diario 08:00 | Vencimiento membresía 30/15/7/1d |
| 13 | `athlete.evaluation_reminder` | Lunes 10:00 | Sin evaluación >180 días |
| 15 | `athlete.weekly_progress_monitor` | Lunes 07:00 | Ranking semanal de progreso |
| 16 | `admin.morning_briefing` | Lun-Vie 07:30 | Briefing diario admin |
| 17 | `admin.end_of_day_summary` | Lun-Sáb 21:00 | Resumen fin de día |
| 18 | `admin.expiring_documents_check` | Diario 09:00 | Documentos por vencer |
| 19 | `admin.equipment_inventory_check` | Lunes 06:00 | Stock bajo + mantenimiento vencido |
| 21 | `marketing.birthday_greetings` | Diario 07:00 | Felicitaciones cumpleaños |
| 22 | `marketing.reactivate_inactive_athletes` | 1ro y 15 10:00 | Campaña reactivación |
| 23 | `marketing.satisfaction_survey` | Trimestral | Encuesta NPS |
| 25 | `marketing.season_enrollment_campaign` | 1ro oct 09:00 | Campaña nueva temporada |
| 26 | `reporting.weekly_executive_report` | Domingos 20:00 | KPIs semanales |
| 27 | `reporting.monthly_performance_report` | 1ro mes 08:00 | Rendimiento deportivo |
| 28 | `reporting.federation_inscription_report` | 1ro agosto 09:00 | Docs federativos |
| 29 | `reporting.predictive_analysis` | Domingos 23:00 | Predicciones IA |
| 31 | `security.verify_backup` | Diario 03:00 | Verificación backups |
| 32 | `security.sensitive_data_audit` | Domingos 04:00 | Auditoría accesos sensibles |
| 33 | `security.rotate_inactive_sessions` | Diario 02:00 | Informe sesiones inactivas |
| 35 | `security.daily_agent_activity_summary` | Diario 23:30 | Resumen actividad agentes |

### Event-driven (llamar desde hooks o frontend)
| AUTO | Task name | Trigger | Llamada |
|------|-----------|---------|---------|
| 04 | `calendar.handle_absence` | Post-insert `training_attendance` con `attended=false` | `handle_absence.delay(athlete_id, session_id)` |
| 05 | `calendar.process_waitlist` | Cancelación de atleta en sesión llena | `process_waitlist.delay(session_id, freed_athlete_id)` |
| 07 | `finance.generate_payment_receipt` | Post-insert `financial_transactions` income | `generate_payment_receipt.delay(transaction_id)` |
| 12 | `athlete.post_competition_followup` | Post-insert `competition_results` | `post_competition_followup.delay(result_id)` |
| 14 | `athlete.injury_protocol` | Post-insert `medical_sessions` tipo lesión | `injury_protocol.delay(medical_session_id)` |
| 20 | `admin.new_athlete_documents` | Post-insert `athletes` | `new_athlete_documents.delay(athlete_id)` |
| 24 | `marketing.request_testimonial` | 24h después de resultado top-3 | `request_testimonial.apply_async(args=[result_id], countdown=86400)` |
| 34 | `security.realtime_event_dispatcher` | Cualquier evento Realtime relevante | `realtime_event_dispatcher.delay(event_type, payload)` |

---

## Cómo levantar en local

```bash
# Terminal 1: Worker
cd backend
celery -A tasks.schedules worker --loglevel=info

# Terminal 2: Beat scheduler
cd backend
celery -A tasks.schedules beat --loglevel=info

# Terminal 3: Flower (monitor)
cd backend
celery -A tasks.schedules flower --port=5555

# Ejecutar tarea manualmente (testing)
cd backend
celery -A tasks.schedules call tasks.admin.morning_briefing
celery -A tasks.schedules call tasks.finance.daily_cash_close
```

---

## Arquitectura de notificaciones

Todas las notificaciones se insertan en la tabla `notifications` (Supabase Realtime) que el frontend lee en tiempo real. Para email/WhatsApp (futuro): `send_email_placeholder()` en `helpers.py` queda como punto de extensión — conectar Resend/Twilio aquí.

```
Tarea Celery
    │
    ├─► notify_user()  ──► INSERT notifications  ──► Supabase Realtime ──► Frontend
    │
    ├─► send_email_placeholder()  ──► notification_log (status='queued')
    │                                  [conectar Resend aquí]
    │
    └─► log_activity()  ──► agent_activity_log  ──► Dashboard observabilidad
```
