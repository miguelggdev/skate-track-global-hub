-- =============================================================
-- Cierra el requisito #1 del spec de Superadmin: "Se debe eliminar
-- cualquier opción de 'Registrar administrador' o 'Crear cuenta' desde el
-- login público. Toda creación de cuentas de clubes se hace de forma
-- interna."
--
-- El commit 6bf19d1 quitó el LINK de Login.tsx, pero la ruta /register
-- (src/pages/Register.tsx) seguía viva y aceptaba un ?invite=<uuid> que,
-- si coincidía con clubs.admin_invite_token, creaba una cuenta 'admin' vía
-- signup público (auth.signUp, anon key) — el mecanismo de la Fase 0,
-- reemplazado como vía principal por /superadmin pero nunca purgado.
--
-- Hoy admin_invite_token es NULL en el único club (no explotable), pero el
-- mecanismo en sí contradice el requisito del spec y quedaba como
-- superficie de ataque si algún día se setea un token por error. Se borra
-- la columna y la rama de la función — un signup público SIN
-- app_metadata.role confiable (el que solo puede setear el backend con
-- service_role) NUNCA puede terminar en 'admin', sin excepción.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- role: si viene de app_metadata (Edge Function create-user-admin o
  -- superadmin-onboard-club, ya validaron permisos del caller antes de
  -- llegar acá) se confía tal cual, incluido 'admin'. Un signup público
  -- (anon, sin app_metadata confiable) SOLO puede terminar en
  -- athlete/parent — nunca admin, sin excepción. Toda alta de admin es
  -- interna, vía /superadmin.
  v_trusted_role := NEW.raw_app_meta_data ->> 'role';
  IF v_trusted_role IS NOT NULL THEN
    v_role := v_trusted_role::user_role;
  ELSE
    v_requested := NEW.raw_user_meta_data ->> 'role';
    v_role := CASE
      WHEN v_requested IN ('athlete', 'parent') THEN v_requested::user_role
      ELSE 'athlete'::user_role
    END;
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
$function$;

ALTER TABLE public.clubs DROP COLUMN IF EXISTS admin_invite_token;
