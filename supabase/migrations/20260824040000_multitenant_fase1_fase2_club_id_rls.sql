-- =============================================================
-- Multi-tenant — Fase 1 (club_id en el Grupo A) + Fase 2 (RLS de
-- aislamiento). Ver plan completo en
-- ~/.claude/plans/linear-roaming-torvalds.md — esta migración implementa
-- ambas fases juntas porque el orden recomendado del plan las corre
-- seguidas y verifica una vez al final.
--
-- Contexto de riesgo: TODAS las tablas de este bloque están vacías en
-- producción hoy (deploy reciente, único dato real: 3 filas en
-- audit_log) — el backfill es trivial, no hay riesgo de pérdida de datos.
--
-- Decisión — audit_log / security_audit_log / agent_activity_log quedan
-- con club_id NULLABLE (no NOT NULL como el resto): se escriben desde
-- muchos puntos del backend con service_role que la Fase 5 (pendiente,
-- backend/tasks + backend/api/routes) todavía no audita uno por uno.
-- Forzar NOT NULL ahora rompería esos inserts. RLS igual protege: una fila
-- con club_id NULL queda invisible para cualquier usuario autenticado
-- (same_club(NULL) es NULL, no true) — fail-closed, no es un hueco de
-- seguridad, es una fila que la Fase 5 debe backfillear con club_id real.
--
-- Grupo B (catálogo global, sin club_id, sin tocar en esta migración):
-- ui_translations, motivational_phrases, rate_limit_cache, blocked_ips,
-- backup_log, knowledge_base.
--
-- club_settings y profiles NO se tocan acá — club_settings ya está
-- deprecada (Fase 7 la reemplaza por clubs), profiles es caso especial
-- de Grupo C (hereda por PK compartida con user_claims, se resuelve con
-- same_club(get_user_club_id(id)) sin columna propia — Fase 3).
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Fase 1a: club_id NOT NULL + índice en las tablas "normales" del Grupo A
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  nn_tables text[] := ARRAY[
    'athletes','coaches','training_sessions','attendance','medical_sessions',
    'financial_transactions','invoices','transactions','competitions',
    'competition_events','external_athletes','evaluations','equipment',
    'equipment_maintenance','courtesy_classes','daily_reports','documents',
    'document_signatures','document_templates','federation_documents',
    'awards','leagues','race_events','special_events',
    'special_event_participants','notifications','notification_log','messages',
    'attendance_alerts','time_records','physical_fitness_tests','training_kpis',
    'retention_campaigns','satisfaction_surveys','result_imports','vaccine_records',
    'whatsapp_subscribers','whatsapp_message_log','user_documents',
    'automation_config','system_settings',
    'athlete_gallery','athlete_body_info','athlete_history',
    'knowledge_documents','document_chunks'
  ];
BEGIN
  FOREACH t IN ARRAY nn_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN club_id uuid REFERENCES public.clubs(id)', t);
    EXECUTE format('UPDATE public.%I SET club_id = public.default_club_id() WHERE club_id IS NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN club_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (club_id)', 'idx_' || t || '_club_id', t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Fase 1b: club_id NULLABLE en las tablas de log (ver nota de riesgo arriba)
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  log_tables text[] := ARRAY['audit_log', 'security_audit_log', 'agent_activity_log'];
BEGIN
  FOREACH t IN ARRAY log_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN club_id uuid REFERENCES public.clubs(id)', t);
    EXECUTE format('UPDATE public.%I SET club_id = public.default_club_id() WHERE club_id IS NULL', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (club_id)', 'idx_' || t || '_club_id', t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Fase 1c: UNIQUE constraints que eran globales y deben pasar a ser por
-- club (Trampa 2 del manual) — cada club numera/nombra lo suyo desde cero,
-- no comparte secuencia con los demás.
-- ─────────────────────────────────────────────────────────────

-- award_scheme_configs ya tenía club_id (de un trabajo previo) pero el
-- UNIQUE era global — bloqueaba que dos clubes tuvieran cada uno su
-- propio esquema "scheme_type" (ej. ambos con un esquema "bronce").
ALTER TABLE public.award_scheme_configs DROP CONSTRAINT award_scheme_configs_scheme_type_key;
ALTER TABLE public.award_scheme_configs ADD CONSTRAINT award_scheme_configs_club_id_scheme_type_key UNIQUE (club_id, scheme_type);

-- daily_reports: un reporte diario por club, no uno global para todos.
ALTER TABLE public.daily_reports DROP CONSTRAINT daily_reports_report_date_key;
ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_club_id_report_date_key UNIQUE (club_id, report_date);

-- external_athletes: dos clubes distintos pueden registrar de forma
-- independiente al mismo atleta externo (de un club rival) visto en sus
-- propias competencias.
ALTER TABLE public.external_athletes DROP CONSTRAINT external_athletes_full_name_club_name_key;
ALTER TABLE public.external_athletes ADD CONSTRAINT external_athletes_club_id_full_name_club_name_key UNIQUE (club_id, full_name, club_name);

-- invoices: cada club numera sus propias facturas desde 1, no comparten secuencia.
ALTER TABLE public.invoices DROP CONSTRAINT invoices_invoice_number_key;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_club_id_invoice_number_key UNIQUE (club_id, invoice_number);

-- leagues: cada club trackea su propia participación en una liga/temporada
-- (el nombre de la liga/temporada puede repetirse entre clubes distintos).
ALTER TABLE public.leagues DROP CONSTRAINT leagues_name_season_year_key;
ALTER TABLE public.leagues ADD CONSTRAINT leagues_club_id_name_season_year_key UNIQUE (club_id, name, season_year);

-- system_settings: cada club configura sus propias claves — no deben
-- compartir un único valor global por setting_key.
ALTER TABLE public.system_settings DROP CONSTRAINT system_settings_setting_key_key;
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_club_id_setting_key_key UNIQUE (club_id, setting_key);

-- whatsapp_subscribers: el mismo teléfono puede suscribirse de forma
-- independiente en más de un club (ej. un padre con hijos en clubes distintos).
ALTER TABLE public.whatsapp_subscribers DROP CONSTRAINT whatsapp_subscribers_phone_number_key;
ALTER TABLE public.whatsapp_subscribers ADD CONSTRAINT whatsapp_subscribers_club_id_phone_number_key UNIQUE (club_id, phone_number);

-- Constraints que se dejan GLOBALES a propósito (no son "de club", son
-- identidad real-world única sin importar el club): athletes.uq_athletes_identification
-- (cédula), athletes_nfc_tag_uid_key (chip físico), athletes_checkin_token_key
-- (token aleatorio), athletes_user_id_key / coaches_user_id_key (1 usuario = 1
-- club ya garantiza esto), y las que ya son transitivamente por club vía FK
-- (attendance, invoices.athlete_id+period, training_kpis, special_event_participants).

-- ─────────────────────────────────────────────────────────────
-- Fase 1d: trigger de conveniencia — si el backend no manda club_id
-- explícito en un INSERT, se completa desde el usuario autenticado. Red de
-- seguridad, no reemplaza mandarlo explícito (Fase 5).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_club_id_from_current_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    NEW.club_id := public.get_user_club_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  all_group_a text[] := ARRAY[
    'athletes','coaches','training_sessions','attendance','medical_sessions',
    'financial_transactions','invoices','transactions','competitions',
    'competition_events','external_athletes','evaluations','equipment',
    'equipment_maintenance','courtesy_classes','daily_reports','documents',
    'document_signatures','document_templates','federation_documents',
    'awards','leagues','race_events','special_events',
    'special_event_participants','notifications','notification_log','messages',
    'attendance_alerts','time_records','physical_fitness_tests','training_kpis',
    'retention_campaigns','satisfaction_surveys','result_imports','vaccine_records',
    'whatsapp_subscribers','whatsapp_message_log','user_documents',
    'automation_config','system_settings',
    'athlete_gallery','athlete_body_info','athlete_history',
    'knowledge_documents','document_chunks',
    'audit_log','security_audit_log','agent_activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY all_group_a LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_club_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_club_id_from_current_user()',
      t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Fase 2: RLS de aislamiento. Se agrega UNA policy RESTRICTIVE nueva por
-- tabla — las ~150 policies de rol existentes (PERMISSIVE) NO se tocan,
-- se combinan con AND contra esta.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  all_group_a_plus text[] := ARRAY[
    'athletes','coaches','training_sessions','attendance','medical_sessions',
    'financial_transactions','invoices','transactions','competitions',
    'competition_events','external_athletes','evaluations','equipment',
    'equipment_maintenance','courtesy_classes','daily_reports','documents',
    'document_signatures','document_templates','federation_documents',
    'awards','leagues','race_events','special_events',
    'special_event_participants','notifications','notification_log','messages',
    'attendance_alerts','time_records','physical_fitness_tests','training_kpis',
    'retention_campaigns','satisfaction_surveys','result_imports','vaccine_records',
    'whatsapp_subscribers','whatsapp_message_log','user_documents',
    'automation_config','system_settings',
    'athlete_gallery','athlete_body_info','athlete_history',
    'knowledge_documents','document_chunks',
    'audit_log','security_audit_log','agent_activity_log',
    'award_scheme_configs'
  ];
BEGIN
  FOREACH t IN ARRAY all_group_a_plus LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.same_club(club_id)) WITH CHECK (public.same_club(club_id))',
      t
    );
  END LOOP;
END $$;
