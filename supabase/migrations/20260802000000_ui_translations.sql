-- =============================================================
-- UI Translations table + profiles.language_code
-- Supports: es, en, fr, it, de, pt
-- =============================================================

-- 1. Add language_code to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language_code text NOT NULL DEFAULT 'es'
    CHECK (language_code IN ('es', 'en', 'fr', 'it', 'de', 'pt'));

-- 2. Create ui_translations table
CREATE TABLE IF NOT EXISTS public.ui_translations (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key  text NOT NULL UNIQUE,
  es   text NOT NULL DEFAULT '',
  en   text NOT NULL DEFAULT '',
  fr   text NOT NULL DEFAULT '',
  it   text NOT NULL DEFAULT '',
  de   text NOT NULL DEFAULT '',
  pt   text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ui_translations_key ON public.ui_translations(key);

-- RLS: all authenticated users can read translations
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translations_select_authenticated" ON public.ui_translations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "translations_manage_admin" ON public.ui_translations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================================
-- 3. Seed translations
-- =============================================================

INSERT INTO public.ui_translations (key, es, en, fr, it, de, pt) VALUES

-- ── Navigation menu ────────────────────────────────────────────
('menu.dashboard',    'Panel',          'Dashboard',       'Tableau de bord',   'Dashboard',        'Dashboard',             'Painel'),
('menu.athletes',     'Deportistas',    'Athletes',        'Sportifs',          'Atleti',           'Sportler',              'Atletas'),
('menu.training',     'Entrenamiento',  'Training',        'Entraînement',      'Allenamento',      'Training',              'Treinamento'),
('menu.times',        'Tiempos',        'Times',           'Temps',             'Tempi',            'Zeiten',                'Tempos'),
('menu.documents',    'Documentos',     'Documents',       'Documents',         'Documenti',        'Dokumente',             'Documentos'),
('menu.equipment',    'Equipamiento',   'Equipment',       'Équipement',        'Attrezzatura',     'Ausrüstung',            'Equipamento'),
('menu.evaluations',  'Evaluaciones',   'Evaluations',     'Évaluations',       'Valutazioni',      'Bewertungen',           'Avaliações'),
('menu.messages',     'Mensajes',       'Messages',        'Messages',          'Messaggi',         'Nachrichten',           'Mensagens'),
('menu.medical',      'Médico',         'Medical',         'Médical',           'Medico',           'Medizinisch',           'Médico'),
('menu.competitions', 'Competencias',   'Competitions',    'Compétitions',      'Competizioni',     'Wettkämpfe',            'Competições'),
('menu.finance',      'Finanzas',       'Finance',         'Finances',          'Finanze',          'Finanzen',              'Finanças'),
('menu.club_config',  'Config. Club',   'Club Settings',   'Paramètres club',   'Impost. club',     'Club-Einstellungen',    'Config. Clube'),
('menu.settings',     'Ajustes',        'Settings',        'Paramètres',        'Impostazioni',     'Einstellungen',         'Configurações'),
('menu.users',        'Usuarios',       'Users',           'Utilisateurs',      'Utenti',           'Benutzer',              'Usuários'),
('menu.logout',       'Cerrar sesión',  'Log out',         'Se déconnecter',    'Esci',             'Abmelden',              'Sair'),

-- ── Roles ──────────────────────────────────────────────────────
('role.admin',    'Administrador',  'Administrator',  'Administrateur',  'Amministratore',  'Administrator',  'Administrador'),
('role.coach',    'Entrenador',     'Coach',          'Entraîneur',      'Allenatore',      'Trainer',        'Treinador'),
('role.athlete',  'Deportista',     'Athlete',        'Sportif',         'Atleta',          'Sportler',       'Atleta'),
('role.delegate', 'Delegado',       'Delegate',       'Délégué',         'Delegato',        'Delegierter',    'Delegado'),
('role.leader',   'Líder',          'Leader',         'Leader',          'Leader',          'Leiter',         'Líder'),
('role.finance',  'Finanzas',       'Finance',        'Finances',        'Finanze',         'Finanzen',       'Finanças'),
('role.parent',   'Padre/Tutor',    'Parent/Guardian','Parent/Tuteur',   'Genitore/Tutore', 'Elternteil',     'Pai/Tutor'),
('role.user',     'Usuario',        'User',           'Utilisateur',     'Utente',          'Benutzer',       'Usuário'),

-- ── Settings ───────────────────────────────────────────────────
('settings.title',               'Ajustes',              'Settings',               'Paramètres',               'Impostazioni',              'Einstellungen',              'Configurações'),
('settings.profile',             'Perfil',               'Profile',                'Profil',                   'Profilo',                   'Profil',                     'Perfil'),
('settings.security',            'Seguridad',            'Security',               'Sécurité',                 'Sicurezza',                 'Sicherheit',                 'Segurança'),
('settings.notifications',       'Notificaciones',       'Notifications',          'Notifications',            'Notifiche',                 'Benachrichtigungen',         'Notificações'),
('settings.preferences',         'Preferencias',         'Preferences',            'Préférences',              'Preferenze',                'Präferenzen',                'Preferências'),
('settings.system',              'Sistema',              'System',                 'Système',                  'Sistema',                   'System',                     'Sistema'),
('settings.language',            'Idioma',               'Language',               'Langue',                   'Lingua',                    'Sprache',                    'Idioma'),
('settings.language_description','Selecciona el idioma de la interfaz', 'Select the interface language', 'Choisissez la langue de l''interface', 'Seleziona la lingua dell''interfaccia', 'Wähle die Sprache der Benutzeroberfläche', 'Selecione o idioma da interface'),
('settings.apply_language',      'Aplicar idioma',       'Apply language',         'Appliquer la langue',      'Applica lingua',            'Sprache anwenden',           'Aplicar idioma'),

-- ── Common ─────────────────────────────────────────────────────
('common.info',       'Información',  'Information',  'Information',   'Informazione',  'Information',   'Informação'),
('common.success',    'Éxito',        'Success',      'Succès',        'Successo',      'Erfolg',        'Sucesso'),
('common.error',      'Error',        'Error',        'Erreur',        'Errore',        'Fehler',        'Erro'),
('common.status',     'Estado',       'Status',       'Statut',        'Stato',         'Status',        'Estado'),
('common.loading',    'Cargando...',  'Loading...',   'Chargement...', 'Caricamento...','Laden...',      'Carregando...'),
('common.my_account', 'Mi cuenta',    'My account',   'Mon compte',    'Il mio account','Mein Konto',   'Minha conta'),
('common.profile',    'Perfil',       'Profile',      'Profil',        'Profilo',       'Profil',        'Perfil'),
('common.config',     'Configuración','Settings',     'Paramètres',    'Impostazioni',  'Einstellungen', 'Configurações'),
('common.close_session','Cerrar sesión','Log out',    'Se déconnecter','Esci',          'Abmelden',      'Sair'),
('common.search',     'Buscar atletas, competencias, entrenamientos...', 'Search athletes, competitions, training...', 'Rechercher sportifs, compétitions, entraînements...', 'Cerca atleti, competizioni, allenamenti...', 'Sportler, Wettkämpfe, Training suchen...', 'Buscar atletas, competições, treinamentos...'),

-- ── Messages / Toasts ──────────────────────────────────────────
('message.saved_successfully',   'Guardado correctamente',   'Saved successfully',    'Enregistré avec succès',       'Salvato con successo',      'Erfolgreich gespeichert',    'Salvo com sucesso'),
('message.updated_successfully', 'Actualizado correctamente','Updated successfully',   'Mis à jour avec succès',       'Aggiornato con successo',   'Erfolgreich aktualisiert',   'Atualizado com sucesso'),
('message.error_occurred',       'Ocurrió un error',         'An error occurred',      'Une erreur s''est produite',   'Si è verificato un errore', 'Ein Fehler ist aufgetreten', 'Ocorreu um erro'),
('message.language_updated',     'Idioma actualizado',       'Language updated',       'Langue mise à jour',           'Lingua aggiornata',         'Sprache aktualisiert',       'Idioma atualizado'),
('message.session_closed',       'Sesión cerrada',           'Session closed',         'Session fermée',               'Sessione chiusa',           'Sitzung beendet',            'Sessão encerrada'),
('message.session_closed_desc',  'Has cerrado sesión correctamente', 'You have logged out successfully', 'Vous avez été déconnecté', 'Sei stato disconnesso', 'Sie wurden erfolgreich abgemeldet', 'Você saiu com sucesso'),
('message.logout_error',         'Error al cerrar sesión',   'Error logging out',      'Erreur lors de la déconnexion','Errore durante la disconnessione','Fehler beim Abmelden',  'Erro ao sair'),

-- ── Actions ────────────────────────────────────────────────────
('action.save',    'Guardar',   'Save',    'Enregistrer', 'Salva',    'Speichern',   'Salvar'),
('action.cancel',  'Cancelar',  'Cancel',  'Annuler',     'Annulla',  'Abbrechen',   'Cancelar'),
('action.delete',  'Eliminar',  'Delete',  'Supprimer',   'Elimina',  'Löschen',     'Excluir'),
('action.edit',    'Editar',    'Edit',    'Modifier',    'Modifica', 'Bearbeiten',  'Editar'),
('action.add',     'Agregar',   'Add',     'Ajouter',     'Aggiungi', 'Hinzufügen',  'Adicionar'),
('action.search',  'Buscar',    'Search',  'Rechercher',  'Cerca',    'Suchen',      'Buscar'),
('action.filter',  'Filtrar',   'Filter',  'Filtrer',     'Filtra',   'Filtern',     'Filtrar'),
('action.export',  'Exportar',  'Export',  'Exporter',    'Esporta',  'Exportieren', 'Exportar'),
('action.close',   'Cerrar',    'Close',   'Fermer',      'Chiudi',   'Schließen',   'Fechar'),
('action.back',    'Volver',    'Back',    'Retour',      'Indietro', 'Zurück',      'Voltar'),
('action.confirm', 'Confirmar', 'Confirm', 'Confirmer',   'Conferma', 'Bestätigen',  'Confirmar'),
('action.download','Descargar', 'Download','Télécharger', 'Scarica',  'Herunterladen','Baixar'),
('action.generate','Generar',   'Generate','Générer',     'Genera',   'Generieren',  'Gerar'),
('action.assign',  'Asignar',   'Assign',  'Attribuer',   'Assegna',  'Zuweisen',    'Atribuir'),

-- ── Forms ──────────────────────────────────────────────────────
('form.select_option',  'Seleccionar opción',  'Select option',   'Sélectionner une option','Seleziona opzione', 'Option auswählen', 'Selecionar opção'),
('form.required_field', 'Campo requerido',     'Required field',  'Champ obligatoire',      'Campo obbligatorio','Pflichtfeld',       'Campo obrigatório'),
('form.no_results',     'Sin resultados',      'No results',      'Aucun résultat',         'Nessun risultato',  'Keine Ergebnisse',  'Sem resultados'),
('form.loading_data',   'Cargando datos...',   'Loading data...', 'Chargement des données...','Caricamento dati...','Daten laden...','Carregando dados...'),

-- ── Search result type labels ───────────────────────────────────
('search.athlete',      'Atleta',       'Athlete',       'Sportif',     'Atleta',       'Sportler',     'Atleta'),
('search.competition',  'Competencia',  'Competition',   'Compétition', 'Competizione', 'Wettkampf',    'Competição'),
('search.training',     'Entrenamiento','Training',      'Entraînement','Allenamento',  'Training',     'Treinamento'),
('search.financial',    'Finanzas',     'Finance',       'Finances',    'Finanze',      'Finanzen',     'Finanças'),
('search.equipment',    'Equipo',       'Equipment',     'Équipement',  'Attrezzatura', 'Ausrüstung',   'Equipamento'),
('search.coach',        'Entrenador',   'Coach',         'Entraîneur',  'Allenatore',   'Trainer',      'Treinador'),
('search.award',        'Premio',       'Award',         'Récompense',  'Premio',       'Auszeichnung', 'Prêmio'),
('search.team',         'Equipo',       'Team',          'Équipe',      'Squadra',      'Team',         'Equipe'),
('search.notification', 'Notificación', 'Notification',  'Notification','Notifica',     'Benachrichtigung','Notificação'),
('search.user',         'Usuario',      'User',          'Utilisateur', 'Utente',       'Benutzer',     'Usuário')

ON CONFLICT (key) DO UPDATE SET
  es = EXCLUDED.es,
  en = EXCLUDED.en,
  fr = EXCLUDED.fr,
  it = EXCLUDED.it,
  de = EXCLUDED.de,
  pt = EXCLUDED.pt;
