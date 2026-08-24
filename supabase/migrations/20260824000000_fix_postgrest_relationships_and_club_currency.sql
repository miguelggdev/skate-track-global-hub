-- Corrige 3 de los 6 bugs de queries rotas encontrados en auditoría 2026-08-24:
-- PostgREST no puede auto-detectar relaciones a través de auth.users (schema no expuesto),
-- así que los embeds athletes->profiles, training_sessions->profiles y profiles->user_roles
-- fallaban con "Could not find a relationship ... in the schema cache" pese a que las FK a
-- auth.users sí existen. Se agregan FKs adicionales (aditivas, no se tocan las existentes)
-- apuntando directo a public.profiles para que el schema cache las descubra.
-- Además, club_settings.currency no existe pese a que useCurrency.ts ya lo usa.

ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.training_sessions
  ADD CONSTRAINT training_sessions_coach_id_profiles_fkey
  FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';

ALTER TABLE public.club_settings
  ADD CONSTRAINT club_settings_currency_check
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'COP'));
