-- =============================================================
-- Multi-tenant — dominio propio por club + admin bootstrap seguro por club.
--
-- Contexto: hoy handle_new_user() cuenta admins EN TODO EL SISTEMA (no por
-- club) para decidir si el usuario nuevo es admin, y el wizard de onboarding
-- (useOnboardingGuard/Onboarding.tsx) chequea si existe *cualquier* fila en
-- club_settings (tabla global, sin club_id) — ambos rotos para un 2º club.
--
-- Esta migración:
--  1. Extiende `clubs` con custom_domain (para resolver club_id por dominio
--     en el signup), onboarding_completed, y las columnas que ya usa el
--     wizard de Onboarding.tsx (antes escribía a club_settings, que ni
--     siquiera tiene esas columnas — el guardado fallaba en silencio).
--  2. admin_invite_token: mecanismo de invitación single-use para que el
--     PRIMER admin de un club nuevo pueda auto-registrarse de forma segura.
--     Sin esto, cualquiera podría pasar `club_id` de un club ajeno en el
--     signup público y auto-declararse su admin (el club_id no es secreto:
--     get_club_by_domain() de abajo lo expone a propósito para el signup).
--     El invite_token si lo es — solo ops lo conoce y se lo entrega al
--     cliente real. No reemplaza a `default_club_id()` (que sigue como red
--     de seguridad para altas fuera de este flujo).
--  3. get_club_by_domain(): lookup público (branding + club_id) para que el
--     frontend resuelva el club antes de loguearse.
--  4. handle_new_user(): usa raw_app_meta_data (solo lo puede setear
--     service_role, ej. la Edge Function create-user-admin) como canal
--     CONFIABLE de role/club_id; raw_user_meta_data (controlable por
--     cualquier caller anónimo vía signUp()) solo puede pedir
--     athlete/parent, o admin SI trae un invite_token válido para ESE club.
-- =============================================================

ALTER TABLE public.clubs
  ADD COLUMN custom_domain       text UNIQUE,
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN admin_invite_token  uuid,
  ADD COLUMN description         text,
  ADD COLUMN website_url         text,
  ADD COLUMN league              text,
  ADD COLUMN country             text,
  ADD COLUMN president_name      text,
  ADD COLUMN president_email     text,
  ADD COLUMN delegate_name       text,
  ADD COLUMN delegate_phone      text;

-- Backfill del club existente: ya tiene admin y ya pasó por onboarding
-- (vía club_settings) — se marca completo y se le asigna el dominio actual.
UPDATE public.clubs
SET custom_domain = 'track.arkanatech.tech',
    onboarding_completed = true
WHERE custom_domain IS NULL;

-- Faltaba policy de UPDATE en `clubs` (solo existía SELECT desde la Fase 0)
-- — la necesita el wizard de onboarding para guardar.
CREATE POLICY "Admins update own club" ON public.clubs
  FOR UPDATE TO authenticated
  USING (
    public.same_club(id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'))
  )
  WITH CHECK (
    public.same_club(id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'leader'))
  );

-- Lookup público de club por dominio. Sin datos sensibles (nombre/logo/
-- colores) — se usa en la pantalla de login/registro antes de autenticar.
CREATE OR REPLACE FUNCTION public.get_club_by_domain(p_domain text)
RETURNS TABLE (id uuid, name text, logo_url text, primary_color text, secondary_color text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, name, logo_url, primary_color, secondary_color
  FROM public.clubs
  WHERE custom_domain = p_domain AND is_active = true
$$;

GRANT EXECUTE ON FUNCTION public.get_club_by_domain TO anon, authenticated;

-- handle_new_user() — misma lógica de perfil/atleta que antes, cambia solo
-- cómo se resuelven club_id y role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        user_role;
  v_birth_date  date;
  v_age         integer;
  v_category    athlete_category;
  v_level       athlete_level;
  v_gender      athlete_gender;
  v_requested   text;
  v_first_name  text;
  v_last_name   text;
  v_club_id     uuid;
  v_trusted_role text;
  v_invite      uuid;
BEGIN
  v_first_name := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1),
    ''
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data ->> 'last_name',
    CASE
      WHEN (NEW.raw_user_meta_data ->> 'full_name') IS NOT NULL
           AND position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) > 0
      THEN substring(
             NEW.raw_user_meta_data ->> 'full_name'
             FROM position(' ' IN (NEW.raw_user_meta_data ->> 'full_name')) + 1
           )
      ELSE ''
    END,
    ''
  );

  -- club_id: primero el canal confiable (app_metadata, solo service_role),
  -- luego el del signup público (resuelto por dominio en el frontend), y
  -- por último el club por defecto como red de seguridad.
  BEGIN
    v_club_id := NULLIF(NEW.raw_app_meta_data ->> 'club_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_club_id := NULL;
  END;
  IF v_club_id IS NULL THEN
    BEGIN
      v_club_id := NULLIF(NEW.raw_user_meta_data ->> 'club_id', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_club_id := NULL;
    END;
  END IF;
  IF v_club_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = v_club_id) THEN
    v_club_id := public.default_club_id();
  END IF;

  -- role: si viene de app_metadata (Edge Function create-user-admin, ya
  -- validó permisos del caller antes de llegar acá) se confía tal cual,
  -- incluido 'admin'. Si no, es un signup público (anon) — solo puede
  -- pedir athlete/parent directamente, o admin SI trae un invite_token
  -- que coincida con el vigente de ESE club (se consume de una sola vez).
  v_trusted_role := NEW.raw_app_meta_data ->> 'role';
  IF v_trusted_role IS NOT NULL THEN
    v_role := v_trusted_role::user_role;
  ELSE
    BEGIN
      v_invite := NULLIF(NEW.raw_user_meta_data ->> 'invite_token', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_invite := NULL;
    END;

    IF v_invite IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE id = v_club_id AND admin_invite_token = v_invite
    ) THEN
      v_role := 'admin';
      UPDATE public.clubs SET admin_invite_token = NULL WHERE id = v_club_id;
    ELSE
      v_requested := NEW.raw_user_meta_data ->> 'role';
      v_role := CASE
        WHEN v_requested IN ('athlete', 'parent') THEN v_requested::user_role
        ELSE 'athlete'::user_role
      END;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    updated_at    = now();

  INSERT INTO public.user_roles (user_id, club_id, role)
  VALUES (NEW.id, v_club_id, v_role)
  ON CONFLICT (user_id, club_id, role) DO NOTHING;

  -- Auto-create athlete record for 'athlete' role
  IF v_role = 'athlete' THEN
    v_birth_date := CASE
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
      ELSE NULL
    END;

    IF v_birth_date IS NOT NULL THEN
      v_age := EXTRACT(YEAR FROM AGE(v_birth_date))::integer;
      v_category := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'prejuvenil'
        WHEN v_age <= 17 THEN 'juvenil'
        ELSE 'mayores'
      END::athlete_category;
      v_level := CASE
        WHEN v_age <= 6  THEN 'escuela'
        WHEN v_age <= 8  THEN 'escuela_menores'
        WHEN v_age <= 10 THEN 'transicion'
        WHEN v_age <= 12 THEN 'pre_juvenil'
        WHEN v_age <= 14 THEN 'juvenil_primer_ano'
        WHEN v_age <= 16 THEN 'juvenil_segundo_ano'
        WHEN v_age <= 17 THEN 'juvenil_tercer_ano'
        ELSE 'mayores_unica'
      END::athlete_level;
    ELSE
      v_category := 'mayores';
      v_level    := 'mayores_unica';
    END IF;

    BEGIN
      v_gender := (NEW.raw_user_meta_data ->> 'gender')::athlete_gender;
    EXCEPTION WHEN others THEN
      v_gender := NULL;
    END;

    INSERT INTO public.athletes (
      user_id, first_name, last_name, email,
      date_of_birth, gender, category, level, status, performance_score
    ) VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      NEW.email,
      v_birth_date, v_gender, v_category, v_level, 'active', 0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name    = EXCLUDED.first_name,
      last_name     = EXCLUDED.last_name,
      email         = EXCLUDED.email,
      date_of_birth = EXCLUDED.date_of_birth,
      gender        = EXCLUDED.gender,
      category      = EXCLUDED.category,
      level         = EXCLUDED.level,
      updated_at    = now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;
