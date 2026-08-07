-- Migration: automation_config — panel de control de automatizaciones Celery
CREATE TABLE IF NOT EXISTS public.automation_config (
  automation_id         text        PRIMARY KEY,
  enabled               boolean     NOT NULL DEFAULT true,
  schedule_hour         smallint    CHECK (schedule_hour BETWEEN 0 AND 23),
  schedule_minute       smallint    CHECK (schedule_minute BETWEEN 0 AND 59),
  schedule_day_of_week  text,
  schedule_day_of_month text,
  custom_params         jsonb       NOT NULL DEFAULT '{}',
  updated_at            timestamptz NOT NULL DEFAULT now(),
  updated_by            uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_config_read"
  ON public.automation_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leader'));

CREATE POLICY "automation_config_write"
  ON public.automation_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Valores por defecto para todas las automatizaciones
INSERT INTO public.automation_config (automation_id, schedule_hour, schedule_minute, custom_params) VALUES
  ('AUTO-01',     19,   0,   '{"days_ahead": 1}'),
  ('AUTO-02',     NULL, NULL, '{"hours_ahead": 2, "window_minutes": 30}'),
  ('AUTO-03',     8,    0,   '{"lookahead_weeks": 4, "min_gap_days": 3}'),
  ('AUTO-04',     NULL, NULL, '{"consecutive_threshold": 3}'),
  ('AUTO-05',     NULL, NULL, '{}'),
  ('AUTO-06',     20,   0,   '{"max_weekly_hours": 15, "overload_threshold": 0.85}'),
  ('AUTO-07',     NULL, NULL, '{}'),
  ('AUTO-08',     9,    0,   '{"days_warning": 30, "days_critical": 60, "days_urgent": 90}'),
  ('AUTO-09',     22,   0,   '{"notify_admin": true}'),
  ('AUTO-10',     18,   0,   '{"projection_months": 3}'),
  ('AUTO-11',     8,    0,   '{"days_before_expiry": 30, "days_urgent": 7}'),
  ('AUTO-12',     NULL, NULL, '{"followup_hours": 24}'),
  ('AUTO-13',     10,   0,   '{"evaluation_months": 6}'),
  ('AUTO-14',     NULL, NULL, '{}'),
  ('AUTO-15',     7,    0,   '{"lookback_weeks": 4}'),
  ('AUTO-16',     7,    30,  '{}'),
  ('AUTO-17',     21,   0,   '{}'),
  ('AUTO-18',     9,    0,   '{"warning_days": 14, "urgent_days": 7}'),
  ('AUTO-19',     6,    0,   '{"low_stock_threshold": 2}'),
  ('AUTO-20',     NULL, NULL, '{}'),
  ('AUTO-21',     7,    0,   '{}'),
  ('AUTO-22',     10,   0,   '{"inactive_days": 60}'),
  ('AUTO-23',     10,   0,   '{}'),
  ('AUTO-24',     NULL, NULL, '{"delay_hours": 24, "min_position": 3}'),
  ('AUTO-25',     9,    0,   '{}'),
  ('AUTO-26',     20,   0,   '{}'),
  ('AUTO-27',     8,    0,   '{}'),
  ('AUTO-28',     9,    0,   '{}'),
  ('AUTO-29',     23,   0,   '{"lookback_months": 6}'),
  ('AUTO-30',     NULL, NULL, '{"max_failures": 5, "window_minutes": 10}'),
  ('AUTO-31',     3,    0,   '{}'),
  ('AUTO-32',     4,    0,   '{"anomaly_threshold": 100}'),
  ('AUTO-33',     2,    0,   '{"inactive_days": 30}'),
  ('AUTO-34',     NULL, NULL, '{}'),
  ('AUTO-35',     23,   30,  '{}'),
  ('AUTO-36-WA',  8,    30,  '{}'),
  ('AUTO-36-BIL', 7,    0,   '{"billing_day": 1, "due_day_of_month": 5}'),
  ('AUTO-37',     9,    0,   '{"pre_due_days": 5, "overdue_cycle_days": 7}')
ON CONFLICT (automation_id) DO NOTHING;
