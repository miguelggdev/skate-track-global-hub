-- =============================================================
-- Bug preexistente encontrado al migrar marketing_tasks.py (AUTO-22) a
-- multi-tenant: reactivate_inactive_athletes() hace
--   db.table("retention_campaigns").upsert({..., "period": ...},
--            on_conflict="athlete_id,campaign_type,period")
-- pero la tabla retention_campaigns NUNCA tuvo una columna "period"
-- (creada en 20260802200000_sprint5_automations_tables.sql sin ella) ni
-- ningún constraint UNIQUE — el on_conflict no matchea nada. Esto rompe
-- TODA corrida de AUTO-22 con "column period does not exist" o "there is
-- no unique or exclusion constraint matching the ON CONFLICT
-- specification", sin relación con multi-tenant. Se corrige acá de una
-- vez porque es la migración que toca esta tabla.
--
-- Se agrega también la unicidad scoped por club_id (mismo criterio de la
-- Fase 1c): dos clubes pueden tener cada uno su campaña de reactivación
-- del mismo atleta... espera, athlete_id ya pertenece a un solo club, así
-- que club_id en el constraint es redundante en la práctica pero
-- consistente con el resto del esquema (y necesario si algún día
-- athlete_id se relaja).
-- =============================================================

ALTER TABLE public.retention_campaigns
  ADD COLUMN period text NOT NULL DEFAULT to_char(now(), 'YYYY-MM');

ALTER TABLE public.retention_campaigns ALTER COLUMN period DROP DEFAULT;

ALTER TABLE public.retention_campaigns
  ADD CONSTRAINT retention_campaigns_club_athlete_type_period_key
  UNIQUE (club_id, athlete_id, campaign_type, period);
