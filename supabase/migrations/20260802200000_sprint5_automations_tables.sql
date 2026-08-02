-- Sprint 5: Tablas auxiliares para las 35 automatizaciones Celery

-- ── Membership ──────────────────────────────────────────────────────────────
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS membership_expires_at  date,
  ADD COLUMN IF NOT EXISTS last_evaluation_date   date;

-- ── Notification log (historial de notificaciones enviadas) ──────────────────
CREATE TABLE IF NOT EXISTS public.notification_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id text        NOT NULL,
  channel       text        NOT NULL CHECK (channel IN ('push', 'email', 'whatsapp', 'sms')),
  recipient_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_ref text,
  subject       text,
  body          text        NOT NULL,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  status        text        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued'))
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_notification_log"
  ON public.notification_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ── Agent activity log (trazabilidad de automatizaciones) ────────────────────
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id  text        NOT NULL,
  agent_id       text        NOT NULL,
  status         text        NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  records_found  integer     NOT NULL DEFAULT 0,
  actions_taken  integer     NOT NULL DEFAULT 0,
  summary        text,
  error_message  text,
  ran_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_agent_activity_log"
  ON public.agent_activity_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ── Attendance alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id          uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  consecutive_absences integer    NOT NULL DEFAULT 0,
  alert_level         text        NOT NULL CHECK (alert_level IN ('warning', 'critical')),
  notified_coach      boolean     NOT NULL DEFAULT false,
  notified_admin      boolean     NOT NULL DEFAULT false,
  resolved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_admin_read_attendance_alerts"
  ON public.attendance_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- ── Daily reports (cierres de caja y resúmenes diarios) ─────────────────────
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date     date        NOT NULL UNIQUE,
  report_type     text        NOT NULL CHECK (report_type IN ('financial', 'operational', 'combined')),
  total_income    numeric(12,2) NOT NULL DEFAULT 0,
  total_expense   numeric(12,2) NOT NULL DEFAULT 0,
  net             numeric(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
  sessions_held   integer     NOT NULL DEFAULT 0,
  attendance_rate numeric(5,2) NOT NULL DEFAULT 0,
  summary_json    jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_finance_read_daily_reports"
  ON public.daily_reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

-- ── Backup log ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.backup_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at      timestamptz NOT NULL DEFAULT now(),
  status      text        NOT NULL CHECK (status IN ('ok', 'failed', 'unknown')),
  details     text,
  alert_sent  boolean     NOT NULL DEFAULT false
);

ALTER TABLE public.backup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_backup_log"
  ON public.backup_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ── Retention campaigns ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retention_campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  campaign_type text       NOT NULL DEFAULT 'reactivation',
  message_sent text        NOT NULL,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  response     text,
  responded_at timestamptz,
  escalated_at timestamptz
);

ALTER TABLE public.retention_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_coach_read_retention"
  ON public.retention_campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- ── Satisfaction surveys ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  respondent_role text    NOT NULL CHECK (respondent_role IN ('athlete', 'parent', 'coach')),
  nps_score   integer     CHECK (nps_score BETWEEN 0 AND 10),
  responses   jsonb       NOT NULL DEFAULT '{}',
  period      text        NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_survey"
  ON public.satisfaction_surveys FOR ALL TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admin_read_all_surveys"
  ON public.satisfaction_surveys FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ── Athlete testimonials ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.athlete_testimonials (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  trigger_result_id uuid REFERENCES public.competition_results(id) ON DELETE SET NULL,
  content     text        NOT NULL,
  approved    boolean     NOT NULL DEFAULT false,
  used_in     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.athlete_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_testimonials"
  ON public.athlete_testimonials FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "athlete_own_testimonial"
  ON public.athlete_testimonials FOR SELECT TO authenticated
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- ── Athlete performance predictions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.athlete_performance_predictions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id           uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  predicted_at         timestamptz NOT NULL DEFAULT now(),
  medal_potential      text        CHECK (medal_potential IN ('high', 'medium', 'low')),
  injury_risk          text        CHECK (injury_risk IN ('high', 'medium', 'low')),
  training_load_status text        CHECK (training_load_status IN ('overloaded', 'optimal', 'underloaded')),
  recommendations      text,
  model_data           jsonb       NOT NULL DEFAULT '{}'
);

ALTER TABLE public.athlete_performance_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_admin_read_predictions"
  ON public.athlete_performance_predictions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- ── Federation documents ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.federation_documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  season       text        NOT NULL,
  doc_type     text        NOT NULL CHECK (doc_type IN ('inscription', 'cert_medical', 'auth_image', 'membership')),
  file_url     text,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'missing')),
  submitted_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.federation_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_federation_docs"
  ON public.federation_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.notification_log IS 'Historial de notificaciones enviadas por las 35 automatizaciones (Sprint 5)';
COMMENT ON TABLE public.agent_activity_log IS 'Trazabilidad de ejecuciones de automatizaciones Celery (Sprint 5)';
COMMENT ON TABLE public.attendance_alerts IS 'Alertas generadas por inasistencias consecutivas (AUTO-04)';
COMMENT ON TABLE public.daily_reports IS 'Cierres de caja diarios generados por AUTO-09';
COMMENT ON TABLE public.backup_log IS 'Registro de verificaciones de backup (AUTO-31)';
COMMENT ON TABLE public.retention_campaigns IS 'Campañas de reactivación de atletas inactivos (AUTO-22)';
COMMENT ON TABLE public.satisfaction_surveys IS 'Encuestas NPS trimestrales (AUTO-23)';
COMMENT ON TABLE public.athlete_testimonials IS 'Testimonios post-logro de atletas (AUTO-24)';
COMMENT ON TABLE public.athlete_performance_predictions IS 'Predicciones de rendimiento semanales (AUTO-29)';
COMMENT ON TABLE public.federation_documents IS 'Documentación para inscripción federativa (AUTO-28)';
