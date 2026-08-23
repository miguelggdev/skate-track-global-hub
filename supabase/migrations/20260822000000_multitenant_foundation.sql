-- =============================================================
-- Multi-tenant Fase 0 — Fundación: clubs, user_claims, custom
-- access token hook.
--
-- Ver docs/manual-multitenant-supabase-portable.md y el plan
-- aprobado (Fases 0-7, sesión 2026-08-22).
--
-- Esta migración NO toca ninguna tabla de negocio todavía (eso es
-- la Fase 1). Solo crea el andamiaje: la tabla clubs (con el club
-- actual como primer registro), user_claims (fuente rápida para el
-- hook), user_roles.club_id, y las funciones de aislamiento.
--
-- club_settings NO se borra aquí — se deja funcionando en paralelo
-- hasta que el frontend (Fase 7) migre a leer de "clubs". Se marca
-- como deprecada.
--
-- ⚠️ Después de aplicar esta migración hay un paso MANUAL en el
-- Dashboard de Supabase (no es código versionable): Authentication
-- → Hooks → Custom Access Token → seleccionar
-- public.custom_access_token_hook. Sin este paso el JWT no lleva
-- club_id y toda la Fase 2 (RLS) devuelve 0 filas para todos.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla clubs (tenant root)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.clubs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE,
  logo_url        text,
  primary_color   text DEFAULT '#1a1a2e',
  secondary_color text DEFAULT '#16213e',
  contact_email   text,
  contact_phone   text,
  address         text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clubs IS
  'Tenant root del sistema multi-club. Reemplaza a club_settings (deprecada, se elimina en una migración de limpieza tras migrar el frontend en la Fase 7).';
COMMENT ON COLUMN public.clubs.is_active IS
  'Interruptor comercial: false suspende el club sin borrar datos (bloquea el login vía custom_access_token_hook, ver más abajo).';

CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migra la fila única de club_settings (si existe) como el primer club.
-- El resto de las fases del plan usan SELECT id FROM clubs ORDER BY
-- created_at LIMIT 1 para recuperar este club durante el backfill.
INSERT INTO public.clubs (name, logo_url, primary_color, secondary_color, contact_email, contact_phone, address, created_at, updated_at)
SELECT
  COALESCE(NULLIF(cs.club_name, ''), 'Club Principal'),
  cs.logo_url, cs.primary_color, cs.secondary_color,
  cs.contact_email, cs.contact_phone, cs.address,
  cs.created_at, cs.updated_at
FROM public.club_settings cs
ORDER BY cs.created_at
LIMIT 1;

-- Red de seguridad: si club_settings estaba vacía (entorno de pruebas
-- nuevo sin fila todavía), igual queda un club por defecto para que el
-- backfill de las fases siguientes tenga a quién apuntar.
INSERT INTO public.clubs (name)
SELECT 'Club Principal'
WHERE NOT EXISTS (SELECT 1 FROM public.clubs);

COMMENT ON TABLE public.club_settings IS
  'DEPRECADA — reemplazada por public.clubs (multi-tenant). Se elimina tras migrar el frontend, ver Fase 7 del plan multi-tenant.';

-- ─────────────────────────────────────────────────────────────
-- 2. user_roles.club_id
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.user_roles ADD COLUMN club_id uuid REFERENCES public.clubs(id);

UPDATE public.user_roles
SET club_id = (SELECT id FROM public.clubs ORDER BY created_at LIMIT 1)
WHERE club_id IS NULL;

ALTER TABLE public.user_roles ALTER COLUMN club_id SET NOT NULL;

-- La unicidad pasa de (user_id, role) a (user_id, club_id, role). Con
-- "1 usuario = 1 club" en la práctica equivale a lo mismo, pero deja el
-- modelo correcto si algún día se relaja esa regla de negocio.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_club_id_role_key UNIQUE (user_id, club_id, role);

CREATE INDEX idx_user_roles_club_id ON public.user_roles(club_id);

-- ─────────────────────────────────────────────────────────────
-- 3. user_claims — tabla plana para el hook (lectura por PK, sin joins)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.user_claims (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id    uuid REFERENCES public.clubs(id),
  role_name  text,
  is_active  boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_claims IS
  'Fuente de lectura rápida para custom_access_token_hook (una fila por PK, sin joins, en el camino crítico del login). Se mantiene sincronizada desde user_roles vía trigger — no editar a mano.';

-- Sincroniza user_claims cada vez que cambian los roles de un usuario.
-- Toma el rol de mayor jerarquía, misma prioridad que get_user_role().
CREATE OR REPLACE FUNCTION public.sync_user_claims()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_club_id uuid;
  v_role    public.user_role;
BEGIN
  SELECT ur.club_id, ur.role INTO v_club_id, v_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
  ORDER BY CASE ur.role
    WHEN 'admin'    THEN 1
    WHEN 'leader'   THEN 2
    WHEN 'coach'    THEN 3
    WHEN 'delegate' THEN 4
    WHEN 'finance'  THEN 5
    WHEN 'athlete'  THEN 6
  END
  LIMIT 1;

  IF v_role IS NULL THEN
    -- El usuario ya no tiene ningún rol — borra sus claims (fail-closed:
    -- sin fila en user_claims, el hook devuelve user_role = 'none').
    DELETE FROM public.user_claims WHERE user_id = v_user_id;
  ELSE
    INSERT INTO public.user_claims (user_id, club_id, role_name, updated_at)
    VALUES (v_user_id, v_club_id, v_role::text, now())
    ON CONFLICT (user_id) DO UPDATE
      SET club_id    = EXCLUDED.club_id,
          role_name  = EXCLUDED.role_name,
          updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_user_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_claims();

-- Backfill inicial: llena user_claims para los usuarios que ya tienen rol.
INSERT INTO public.user_claims (user_id, club_id, role_name)
SELECT DISTINCT ON (ur.user_id) ur.user_id, ur.club_id, ur.role::text
FROM public.user_roles ur
ORDER BY ur.user_id, CASE ur.role
  WHEN 'admin' THEN 1 WHEN 'leader' THEN 2 WHEN 'coach' THEN 3
  WHEN 'delegate' THEN 4 WHEN 'finance' THEN 5 WHEN 'athlete' THEN 6
END
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. custom_access_token_hook — inyecta club_id/user_role en el JWT
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  claims        jsonb;
  v_role        text;
  v_club_id     text;
  v_active      boolean;
  v_club_active boolean;
BEGIN
  SELECT uc.role_name, uc.club_id::text,
         COALESCE(uc.is_active, true),
         COALESCE(c.is_active, true)
    INTO v_role, v_club_id, v_active, v_club_active
    FROM public.user_claims uc
    LEFT JOIN public.clubs c ON c.id = uc.club_id
   WHERE uc.user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Usuario sin fila en user_claims → sin permisos (fail-closed)
  IF v_role IS NULL THEN
    claims := jsonb_set(claims, '{user_role}', '"none"'::jsonb);
    RETURN jsonb_set(event, '{claims}', claims);
  END IF;

  -- Usuario o club desactivado → bloqueado. Este es el mecanismo para
  -- suspender un club moroso (clubs.is_active = false) sin borrar nada.
  IF NOT v_active OR NOT v_club_active THEN
    claims := jsonb_set(claims, '{user_role}', '"blocked"'::jsonb);
    RETURN jsonb_set(event, '{claims}', claims);
  END IF;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  IF v_club_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{club_id}', to_jsonb(v_club_id));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Solo el servicio de Auth de Supabase puede ejecutar el hook.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON public.user_claims TO supabase_auth_admin;
GRANT SELECT ON public.clubs TO supabase_auth_admin;

-- ─────────────────────────────────────────────────────────────
-- 5. Funciones de lectura del JWT + aislamiento por club
-- ─────────────────────────────────────────────────────────────
-- NOTA: en Supabase Cloud (managed) el schema "auth" está reservado —
-- ningún rol de proyecto (ni siquiera "postgres") puede crear objetos
-- ahí. El manual de referencia asume self-hosted (superusuario). Por
-- eso estos helpers van en "public", igual que has_role()/get_user_role().

CREATE OR REPLACE FUNCTION public.user_club_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'club_id', '')::uuid
$$;

-- Función de aislamiento — usa "=" (NUNCA IS NOT DISTINCT FROM: no es
-- indexable, degrada a Seq Scan y empeora con cada club nuevo — medido
-- 237x más lento en el manual de referencia). Sin LEAKPROOF a propósito
-- (aporta <8% y arriesga filtrar datos vía mensajes de error).
CREATE OR REPLACE FUNCTION public.same_club(row_club_id uuid)
RETURNS boolean
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT row_club_id = NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'club_id', '')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.same_club TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.user_club_id TO authenticated, anon, service_role;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS en las tablas nuevas
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own club" ON public.clubs
  FOR SELECT TO authenticated
  USING (public.same_club(id));

-- Alta/edición de clubes es una operación administrativa que hoy se hace
-- vía service_role o SQL directo — a propósito no hay policy de
-- INSERT/UPDATE/DELETE para 'authenticated'. Se agrega si en el futuro
-- existe un panel de super-admin de plataforma (fuera de este plan).

ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
-- Sin policies para 'authenticated'/'anon': deny-by-default. Es una tabla
-- interna del hook — solo la escribe el trigger (SECURITY DEFINER) y la
-- lee supabase_auth_admin/service_role (que no pasan por RLS).
