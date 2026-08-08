-- =============================================================
-- SPEC-026 — Expansión del diccionario de traducciones (i18n)
-- Añade títulos de página, estados comunes y acciones para
-- extender la cobertura más allá del chrome (nav/login/settings).
-- Idempotente: ON CONFLICT (key) DO NOTHING.
-- Orden de columnas: (key, es, en, fr, it, de, pt)
-- =============================================================

INSERT INTO public.ui_translations (key, es, en, fr, it, de, pt) VALUES

-- ── Títulos de página ──────────────────────────────────────────
('page.athletes.title',     'Gestión de Deportistas', 'Athletes Management',  'Gestion des sportifs',   'Gestione atleti',       'Sportlerverwaltung',     'Gestão de Atletas'),
('page.training.title',     'Entrenamientos',         'Training',             'Entraînements',          'Allenamenti',           'Training',               'Treinos'),
('page.competitions.title', 'Competencias',           'Competitions',         'Compétitions',           'Competizioni',          'Wettkämpfe',             'Competições'),
('page.finance.title',      'Finanzas',               'Finance',              'Finances',               'Finanze',               'Finanzen',               'Finanças'),
('page.documents.title',    'Documentos',             'Documents',            'Documents',              'Documenti',             'Dokumente',              'Documentos'),
('page.equipment.title',    'Equipamiento',           'Equipment',            'Équipement',             'Attrezzatura',          'Ausrüstung',             'Equipamento'),
('page.medical.title',      'Módulo Médico',          'Medical',              'Médical',                'Medico',                'Medizinisch',            'Médico'),
('page.messages.title',     'Mensajes',               'Messages',             'Messages',               'Messaggi',              'Nachrichten',            'Mensagens'),
('page.reports.title',      'Reportes',               'Reports',              'Rapports',               'Report',                'Berichte',               'Relatórios'),
('page.users.title',        'Gestión de Usuarios',    'User Management',      'Gestion des utilisateurs','Gestione utenti',      'Benutzerverwaltung',     'Gestão de Usuários'),
('page.automations.title',  'Automatizaciones',       'Automations',          'Automatisations',        'Automazioni',           'Automatisierungen',      'Automações'),
('page.knowledge.title',    'Base de Conocimiento',   'Knowledge Base',       'Base de connaissances',  'Base di conoscenza',    'Wissensdatenbank',       'Base de Conhecimento'),

-- ── Estados comunes ────────────────────────────────────────────
('common.loading',          'Cargando...',            'Loading...',           'Chargement...',          'Caricamento...',        'Laden...',               'Carregando...'),
('common.connection_error', 'Error de conexión',      'Connection error',     'Erreur de connexion',    'Errore di connessione', 'Verbindungsfehler',      'Erro de conexão'),
('common.no_results',       'Sin resultados',         'No results',           'Aucun résultat',         'Nessun risultato',      'Keine Ergebnisse',       'Sem resultados'),
('common.error_generic',    'Ocurrió un error',       'An error occurred',    'Une erreur s''est produite','Si è verificato un errore','Ein Fehler ist aufgetreten','Ocorreu um erro'),
('common.required',         'Requerido',              'Required',             'Requis',                 'Obbligatorio',          'Erforderlich',           'Obrigatório'),
('common.optional',         'Opcional',               'Optional',             'Optionnel',              'Opzionale',             'Optional',               'Opcional'),

-- ── Acciones adicionales ───────────────────────────────────────
('action.retry',            'Reintentar',             'Retry',                'Réessayer',              'Riprova',               'Erneut versuchen',       'Tentar novamente'),
('action.export',           'Exportar',               'Export',               'Exporter',               'Esporta',               'Exportieren',            'Exportar'),
('action.import',           'Importar',               'Import',               'Importer',               'Importa',               'Importieren',            'Importar'),
('action.download',         'Descargar',              'Download',             'Télécharger',            'Scarica',               'Herunterladen',          'Baixar'),
('action.refresh',          'Actualizar',             'Refresh',              'Actualiser',             'Aggiorna',              'Aktualisieren',          'Atualizar'),
('action.view',             'Ver',                    'View',                 'Voir',                   'Visualizza',            'Ansehen',                'Ver'),
('action.filter',           'Filtrar',                'Filter',               'Filtrer',                'Filtra',                'Filtern',                'Filtrar'),
('action.close',            'Cerrar',                 'Close',                'Fermer',                 'Chiudi',                'Schließen',              'Fechar'),

-- ── Estados vacíos / errores por página ────────────────────────
('empty.athletes',          'No hay deportistas registrados', 'No athletes registered', 'Aucun sportif enregistré', 'Nessun atleta registrato', 'Keine Sportler registriert', 'Nenhum atleta cadastrado'),
('page.athletes.load_error','Error al cargar atletas','Error loading athletes','Erreur de chargement des sportifs','Errore nel caricamento degli atleti','Fehler beim Laden der Sportler','Erro ao carregar atletas')

ON CONFLICT (key) DO NOTHING;
