-- =============================================================
-- Fix: automation_config quedó con club_id NOT NULL (Fase 1,
-- 20260824040000) pero su PRIMARY KEY siguió siendo automation_id solo
-- (global). Con un único club esto no se notaba, pero en cuanto exista un
-- 2do club activo, el UPDATE/upsert del panel /automatizaciones
-- (backend/api/routes/automations.py) pisaría la fila de OTRO club — solo
-- puede existir una fila por automation_id en toda la base, sin importar
-- club_id. Se cambia la PK a (club_id, automation_id), como ya se hizo en
-- la Fase 1c con award_scheme_configs/daily_reports/invoices/etc.
-- =============================================================

ALTER TABLE public.automation_config DROP CONSTRAINT automation_config_pkey;
ALTER TABLE public.automation_config ADD CONSTRAINT automation_config_pkey PRIMARY KEY (club_id, automation_id);
