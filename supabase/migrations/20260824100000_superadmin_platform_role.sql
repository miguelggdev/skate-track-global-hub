-- =============================================================
-- Superadmin / Onboarding interno de clubes — a pedido explícito del
-- usuario tras revisar el flujo de admin-bootstrap-por-invite-token
-- (migración 20260824030000). Reemplaza ese modelo como camino PRINCIPAL
-- de alta de clubes: en vez de un link público /register?invite=<token>
-- que cualquiera con el token puede usar, un rol "superadmin" (plataforma,
-- SIN club_id — no es miembro de ningún club) da de alta clubes y a su
-- primer administrador desde un panel interno.
--
-- El mecanismo de invite_token de la migración anterior NO se borra
-- (columna admin_invite_token, lógica en handle_new_user) — queda como
-- fallback inactivo mientras no se genere ningún token nuevo. Se deja de
-- exponer en el frontend (Login.tsx pierde el link "Crear cuenta de
-- administrador").
--
-- Diseño: platform_admins es una tabla aparte, NO un valor nuevo en el
-- enum user_role. Los superadmins no pertenecen a NINGÚN club — meterlos
-- en user_roles (club_id NOT NULL) los ataría artificialmente a uno,
-- rompiendo el significado real del rol.
-- =============================================================

CREATE TABLE public.platform_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.platform_admins IS
  'Operadores de la plataforma (fuera de cualquier club) — dan de alta clubes nuevos y su primer admin. Sin flujo de auto-registro a propósito: solo se agregan vía SQL directo o por otro platform_admin desde el panel.';

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin TO authenticated, anon, service_role;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;

-- Un platform_admin puede ver la lista completa (para mostrar "quién más
-- tiene acceso" en el panel, si se necesita más adelante). Sin policy de
-- INSERT/UPDATE/DELETE para 'authenticated' a propósito — alta de
-- superadmins nuevos es SQL directo o vía service_role, nunca autoservicio.
CREATE POLICY "Platform admins view platform admins" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ── clubs: columnas que pide el formulario de alta (spec del usuario) ──────

ALTER TABLE public.clubs
  ADD COLUMN city text,
  ADD COLUMN mobile_phone text;

COMMENT ON COLUMN public.clubs.contact_phone IS 'Teléfono fijo del club.';
COMMENT ON COLUMN public.clubs.mobile_phone IS 'Teléfono de contacto móvil del club.';

-- ── clubs: los platform_admins ven y gestionan TODOS los clubes ────────────
-- (las policies existentes de la Fase 0/admin-bootstrap — "Users view own
-- club" / "Admins update own club" — siguen intactas, esto se agrega
-- encima como policies adicionales PERMISSIVE, se combinan por OR).

CREATE POLICY "Platform admins view all clubs" ON public.clubs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins update any club" ON public.clubs
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- El INSERT de un club nuevo pasa por la Edge Function
-- superadmin-onboard-club, que usa service_role (bypassa RLS) — no hace
-- falta una policy de INSERT para 'authenticated'.

-- ── Bootstrap: el único admin real hoy pasa a ser el primer platform_admin ──
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'miguelangelggarzon@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
