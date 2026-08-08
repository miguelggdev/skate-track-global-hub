-- =============================================================
-- SPEC-026 — Claves de sección para páginas (i18n incremental)
-- Training / Competitions / Finance cableados con t().
-- Idempotente: ON CONFLICT (key) DO NOTHING.
-- Orden de columnas: (key, es, en, fr, it, de, pt)
-- =============================================================

INSERT INTO public.ui_translations (key, es, en, fr, it, de, pt) VALUES
('section.attendance_register', 'Registro de Asistencia', 'Attendance Register', 'Registre de présence', 'Registro presenze', 'Anwesenheitserfassung', 'Registro de Presença'),
('section.attendance_reports',  'Reportes de Asistencia', 'Attendance Reports',  'Rapports de présence', 'Report presenze',   'Anwesenheitsberichte', 'Relatórios de Presença')
ON CONFLICT (key) DO NOTHING;
