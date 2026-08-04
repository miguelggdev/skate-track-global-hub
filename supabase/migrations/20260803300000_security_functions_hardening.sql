-- ============================================================
-- Security hardening: SET search_path en funciones utilitarias
-- ============================================================

-- set_updated_at() sin SET search_path puede resolver now() desde
-- un schema malicioso si el search_path de la sesión es manipulado.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Separar las policies FOR ALL en médicos en políticas por operación
-- (ya está cubierto en migraciones previas — solo verificar no duplicar)
-- Esta migración solo cubre el hardening de funciones.

-- Revocar permisos innecesarios en funciones públicas
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
