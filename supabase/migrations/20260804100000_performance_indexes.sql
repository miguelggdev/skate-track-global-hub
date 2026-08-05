-- ============================================================
-- Índices de rendimiento para queries frecuentes
-- Todos usan CONCURRENTLY para no bloquear la BD
-- ============================================================

-- ── financial_transactions ───────────────────────────────────────────────────
-- Queries más frecuentes: por fecha (dashboard, stats), por atleta+estado (morosos)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ft_transaction_date
    ON public.financial_transactions (transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ft_athlete_id
    ON public.financial_transactions (athlete_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ft_payment_status_pending
    ON public.financial_transactions (payment_status, amount)
    WHERE payment_status IN ('pending', 'overdue');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ft_date_status
    ON public.financial_transactions (transaction_date, payment_status, amount);

-- ── training_sessions ─────────────────────────────────────────────────────────
-- Queries frecuentes: próximas sesiones, sesiones por mes, por coach

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ts_scheduled_at
    ON public.training_sessions (scheduled_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ts_coach_date
    ON public.training_sessions (coach_id, scheduled_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ts_type_date
    ON public.training_sessions (training_type, scheduled_at DESC);

-- ── training_attendance ──────────────────────────────────────────────────────
-- Joins frecuentes con training_sessions, filtros por atleta y asistencia
-- Nota: idx_ta_athlete_id e idx_ta_attended ya existen desde la migración de creación.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ta_session_attended
    ON public.training_attendance (training_session_id, attended);

-- ── athletes ─────────────────────────────────────────────────────────────────
-- Filtros más frecuentes: activos, por categoría

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_status
    ON public.athletes (status)
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_category_status
    ON public.athletes (category, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_user_id
    ON public.athletes (user_id);

-- ── competition_results ───────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cr_athlete_id
    ON public.competition_results (athlete_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cr_competition_id
    ON public.competition_results (competition_id);

-- ── notifications ─────────────────────────────────────────────────────────────
-- El índice idx_notifications_user_read ya existe en la migración inicial (usa columna `read` boolean).
-- No se añade índice duplicado aquí.

-- ── RPC: estadísticas financieras agregadas ────────────────────────────────────
-- Reemplaza el full-table scan de useFinancialStats con agregación SQL pura.

CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'total_income',
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        'total_expenses',
            COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
        'net_profit',
            COALESCE(SUM(amount), 0),
        'pending_amount',
            COALESCE(SUM(CASE WHEN payment_status = 'pending'
                              THEN ABS(amount) ELSE 0 END), 0),
        'pending_count',
            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END),
        'current_month_income',
            COALESCE(SUM(CASE
                WHEN amount > 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE)
                THEN amount ELSE 0 END), 0),
        'prev_month_income',
            COALESCE(SUM(CASE
                WHEN amount > 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                THEN amount ELSE 0 END), 0),
        'current_month_expenses',
            COALESCE(ABS(SUM(CASE
                WHEN amount < 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE)
                THEN amount ELSE 0 END)), 0),
        'prev_month_expenses',
            COALESCE(ABS(SUM(CASE
                WHEN amount < 0
                 AND date_trunc('month', transaction_date::date)
                   = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                THEN amount ELSE 0 END)), 0),
        'pending_count_current',
            COUNT(CASE WHEN payment_status IN ('pending','overdue') THEN 1 END)
    )
    FROM financial_transactions;
$$;

REVOKE ALL ON FUNCTION public.get_financial_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_financial_summary() TO authenticated;
