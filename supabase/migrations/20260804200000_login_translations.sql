-- ============================================================
-- Login page translations + anon read policy
-- The login/register pages render for unauthenticated users,
-- so the existing "authenticated" policy was not covering them.
-- ============================================================

-- Allow unauthenticated users to read translations
-- (needed for Login and Register pages before a session exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ui_translations'
      AND policyname = 'translations_select_anon'
  ) THEN
    CREATE POLICY "translations_select_anon" ON public.ui_translations
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Seed login.* translation keys (6 languages)
INSERT INTO public.ui_translations (key, es, en, fr, it, de, pt) VALUES
('login.email',           'Correo electrónico',         'Email address',            'Adresse e-mail',             'Indirizzo email',              'E-Mail-Adresse',             'Endereço de e-mail'),
('login.password',        'Contraseña',                 'Password',                 'Mot de passe',               'Password',                     'Passwort',                   'Senha'),
('login.submit',          'Iniciar sesión',             'Log in',                   'Se connecter',               'Accedi',                       'Anmelden',                   'Entrar'),
('login.signing_in',      'Iniciando sesión...',        'Signing in...',            'Connexion en cours...',      'Accesso in corso...',          'Anmeldung läuft...',         'Entrando...'),
('login.forgot_password', '¿Olvidaste tu contraseña?', 'Forgot your password?',    'Mot de passe oublié ?',      'Password dimenticata?',        'Passwort vergessen?',        'Esqueceu sua senha?'),
('login.error',           'Error al iniciar sesión',   'Login error',              'Erreur de connexion',        'Errore di accesso',            'Anmeldefehler',              'Erro ao entrar'),
('login.welcome',         '¡Bienvenido de vuelta!',    'Welcome back!',            'Bon retour !',               'Bentornato!',                  'Willkommen zurück!',         'Bem-vindo de volta!')

ON CONFLICT (key) DO UPDATE SET
  es = EXCLUDED.es,
  en = EXCLUDED.en,
  fr = EXCLUDED.fr,
  it = EXCLUDED.it,
  de = EXCLUDED.de,
  pt = EXCLUDED.pt;
