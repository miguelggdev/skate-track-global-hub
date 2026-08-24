-- Corrige 2 hallazgos del advisor de seguridad de Supabase (auditoría 2026-08-24):
-- 1. public.wheel_limits_by_category es una vista SECURITY DEFINER (ERROR) que ignora el
--    RLS del usuario que consulta. No expone datos sensibles (es una tabla de valores
--    constantes hardcodeados), pero se corrige a security_invoker por buena práctica.
-- 2. 3 funciones sin search_path fijo (WARN, riesgo de search_path hijacking):
--    default_club_id(), same_club(uuid), user_club_id() — de la migración multi-tenant.

ALTER VIEW public.wheel_limits_by_category SET (security_invoker = true);

ALTER FUNCTION public.default_club_id() SET search_path = 'public';
ALTER FUNCTION public.same_club(uuid) SET search_path = 'public';
ALTER FUNCTION public.user_club_id() SET search_path = 'public';
