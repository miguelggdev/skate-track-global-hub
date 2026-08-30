-- =============================================================
-- Planes de suscripción por club (Starter / Profesional / Premium /
-- Personalizado) + gate real de acceso a los 13 agentes IA según el plan.
-- Pedido explícito del usuario: la landing (speedskatetrack) promete que
-- el "Asistente IA" es exclusivo de Profesional+ — hoy el producto no
-- aplicaba esa restricción, cualquier club tenía acceso completo.
--
-- `plan` es la etiqueta de negocio (los 3 planes reales + 'custom' para
-- acuerdos a medida, ej. federaciones — mencionado en la landing).
-- `agents_enabled` es el gate técnico real, separado a propósito: se
-- autocompleta según el plan al onboardear, pero Superadmin puede
-- anularlo a mano (ej. dar de alta un club 'custom' sin agentes, o un
-- Starter de cortesía con agentes activados) sin tener que inventar un
-- plan nuevo por cada excepción.
-- =============================================================

CREATE TYPE public.club_plan AS ENUM ('starter', 'profesional', 'premium', 'custom');

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS plan public.club_plan NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS agents_enabled boolean NOT NULL DEFAULT false;

-- El club existente ya viene usando los agentes activamente en pruebas —
-- no cortarle el acceso retroactivamente.
UPDATE public.clubs SET plan = 'premium', agents_enabled = true;
