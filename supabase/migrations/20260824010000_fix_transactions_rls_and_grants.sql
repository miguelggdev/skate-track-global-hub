-- Corrige el bug #6 de la auditoría 2026-08-24: la tabla public.transactions tenía
-- políticas RLS creadas pero RLS estaba DESHABILITADO en la tabla (advisor ERROR de
-- Supabase: policy_exists_rls_disabled), y ADEMÁS nunca se le otorgaron privilegios a
-- anon/authenticated (a diferencia de financial_transactions, que sí los tiene) — por eso
-- toda query fallaba con 42501 "permission denied for table transactions".
-- Se otorgan los mismos privilegios que ya tiene financial_transactions (RLS es la capa
-- real de control de acceso vía las 3 policies existentes: "Athlete views own
-- transactions", "Finance manages transactions", "Parent views child transactions").

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon, authenticated;
