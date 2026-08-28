-- =============================================================
-- Notificaciones por Telegram — pedido explícito del usuario.
-- Dos canales separados:
--   1) Superadmin (infra: servidor/contenedores/deploys) — platform_admins.
--      No depende de ningún club, un chat_id por platform_admin.
--   2) Admin de cada club (pagos, atletas nuevos, seguridad,
--      automatizaciones fallidas) — vía system_settings (category=
--      'notifications'), el mismo mecanismo genérico que ya usa el resto
--      de la configuración del club (NotificationSettings.tsx/SettingRow.tsx).
--      Un solo chat_id por club (grupo de Telegram del club, no cuenta
--      personal), clasificado por tema con toggles independientes.
-- =============================================================

-- ── 1) Superadmin: chat_id personal para alertas de infraestructura ────────

ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS telegram_chat_id text;

DROP POLICY IF EXISTS "Platform admins update own telegram chat_id" ON public.platform_admins;
CREATE POLICY "Platform admins update own telegram chat_id"
  ON public.platform_admins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2) Club: nuevas claves en system_settings (category='notifications') ───
-- Una fila por club existente hoy. superadmin-onboard-club se actualiza
-- (fuera de esta migración, en la Edge Function) para insertarlas también
-- en cada club nuevo.

INSERT INTO public.system_settings (club_id, setting_key, setting_value, setting_type, category, description)
SELECT c.id, v.setting_key, v.setting_value, v.setting_type, 'notifications', v.description
FROM public.clubs c
CROSS JOIN (VALUES
  ('telegram_chat_id', '', 'string',
   'Chat ID del grupo de Telegram del club. Para obtenerlo: creá un grupo, agregá al bot y escribile cualquier mensaje — el bot responde con el Chat ID. Pegalo acá.'),
  ('telegram_notify_payments', 'false', 'boolean',
   'Avisar por Telegram cuando se registre un pago'),
  ('telegram_notify_new_athletes', 'false', 'boolean',
   'Avisar por Telegram cuando se registre un atleta nuevo'),
  ('telegram_notify_security', 'false', 'boolean',
   'Avisar por Telegram ante accesos sospechosos o alertas de seguridad'),
  ('telegram_notify_automation_failures', 'false', 'boolean',
   'Avisar por Telegram cuando una automatización falle')
) AS v(setting_key, setting_value, setting_type, description)
ON CONFLICT (club_id, setting_key) DO NOTHING;
