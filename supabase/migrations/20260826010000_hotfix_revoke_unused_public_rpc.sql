-- =============================================================
-- Hallazgo medio de la auditoría del 26-ago: `recalculate_league_positions`
-- y `refresh_document_statuses` son SECURITY DEFINER, sin chequeo de rol ni
-- club, y ejecutables incluso por `anon` (no autenticado). Ninguna de las
-- dos se llama desde el frontend ni desde ningún trigger — son funciones de
-- mantenimiento huérfanas. No exponen datos (ambas hacen UPDATE, no
-- devuelven filas) pero cualquiera podía forzar un recálculo/refresh a
-- voluntad. Se revoca el acceso público; quedan disponibles solo para
-- `service_role` (o para llamarlas a mano vía SQL si hace falta).
-- =============================================================

REVOKE EXECUTE ON FUNCTION public.recalculate_league_positions(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_document_statuses() FROM anon, authenticated;
