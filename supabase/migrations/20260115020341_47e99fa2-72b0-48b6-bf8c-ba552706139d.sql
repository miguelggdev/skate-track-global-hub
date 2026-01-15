-- Add language_code column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) NOT NULL DEFAULT 'es';

-- Add constraint for allowed language values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_language_code;

ALTER TABLE profiles 
ADD CONSTRAINT valid_language_code 
CHECK (language_code IN ('es', 'en', 'fr', 'de', 'it', 'pt'));

-- Create ui_translations table for storing all UI translations
CREATE TABLE IF NOT EXISTS ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  es TEXT NOT NULL,
  en TEXT NOT NULL,
  fr TEXT NOT NULL,
  de TEXT NOT NULL,
  it TEXT NOT NULL,
  pt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ui_translations
ALTER TABLE ui_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations (public read access)
CREATE POLICY "Anyone can read translations" 
ON ui_translations FOR SELECT 
USING (true);

-- Insert all translation records
INSERT INTO ui_translations (key, es, en, fr, de, it, pt) VALUES
-- Menu items
('menu.dashboard', 'Dashboard', 'Dashboard', 'Tableau de bord', 'Dashboard', 'Dashboard', 'Painel'),
('menu.athletes', 'Deportistas', 'Athletes', 'Athlètes', 'Athleten', 'Atleti', 'Atletas'),
('menu.training', 'Entrenamientos', 'Training', 'Entraînement', 'Training', 'Allenamento', 'Treino'),
('menu.competitions', 'Competencias', 'Competitions', 'Compétitions', 'Wettbewerbe', 'Competizioni', 'Competições'),
('menu.finance', 'Finanzas', 'Finance', 'Finances', 'Finanzen', 'Finanze', 'Finanças'),
('menu.reports', 'Reportes', 'Reports', 'Rapports', 'Berichte', 'Report', 'Relatórios'),
('menu.settings', 'Configuración', 'Settings', 'Paramètres', 'Einstellungen', 'Impostazioni', 'Configurações'),
('menu.logout', 'Cerrar Sesión', 'Logout', 'Déconnexion', 'Abmelden', 'Disconnetti', 'Sair'),
('menu.users', 'Usuarios', 'Users', 'Utilisateurs', 'Benutzer', 'Utenti', 'Usuários'),
('menu.club_config', 'Configuración Club', 'Club Settings', 'Paramètres du Club', 'Vereinseinstellungen', 'Impostazioni Club', 'Configurações do Clube'),
('menu.calendar', 'Calendario', 'Calendar', 'Calendrier', 'Kalender', 'Calendario', 'Calendário'),

-- Actions
('action.create', 'Crear', 'Create', 'Créer', 'Erstellen', 'Crea', 'Criar'),
('action.edit', 'Editar', 'Edit', 'Modifier', 'Bearbeiten', 'Modifica', 'Editar'),
('action.delete', 'Eliminar', 'Delete', 'Supprimer', 'Löschen', 'Elimina', 'Excluir'),
('action.save', 'Guardar', 'Save', 'Enregistrer', 'Speichern', 'Salva', 'Salvar'),
('action.cancel', 'Cancelar', 'Cancel', 'Annuler', 'Abbrechen', 'Annulla', 'Cancelar'),
('action.confirm', 'Confirmar', 'Confirm', 'Confirmer', 'Bestätigen', 'Conferma', 'Confirmar'),
('action.search', 'Buscar', 'Search', 'Rechercher', 'Suchen', 'Cerca', 'Pesquisar'),
('action.filter', 'Filtrar', 'Filter', 'Filtrer', 'Filtern', 'Filtra', 'Filtrar'),
('action.export', 'Exportar', 'Export', 'Exporter', 'Exportieren', 'Esporta', 'Exportar'),
('action.apply', 'Aplicar', 'Apply', 'Appliquer', 'Anwenden', 'Applica', 'Aplicar'),
('action.reset', 'Restablecer', 'Reset', 'Réinitialiser', 'Zurücksetzen', 'Ripristina', 'Redefinir'),
('action.add', 'Agregar', 'Add', 'Ajouter', 'Hinzufügen', 'Aggiungi', 'Adicionar'),
('action.view', 'Ver', 'View', 'Voir', 'Ansehen', 'Visualizza', 'Ver'),
('action.download', 'Descargar', 'Download', 'Télécharger', 'Herunterladen', 'Scarica', 'Baixar'),
('action.upload', 'Subir', 'Upload', 'Téléverser', 'Hochladen', 'Carica', 'Enviar'),
('action.close', 'Cerrar', 'Close', 'Fermer', 'Schließen', 'Chiudi', 'Fechar'),
('action.back', 'Volver', 'Back', 'Retour', 'Zurück', 'Indietro', 'Voltar'),
('action.next', 'Siguiente', 'Next', 'Suivant', 'Weiter', 'Avanti', 'Próximo'),
('action.previous', 'Anterior', 'Previous', 'Précédent', 'Zurück', 'Precedente', 'Anterior'),
('action.update', 'Actualizar', 'Update', 'Mettre à jour', 'Aktualisieren', 'Aggiorna', 'Atualizar'),
('action.refresh', 'Refrescar', 'Refresh', 'Rafraîchir', 'Aktualisieren', 'Aggiorna', 'Atualizar'),

-- Roles
('role.admin', 'Administrador', 'Administrator', 'Administrateur', 'Administrator', 'Amministratore', 'Administrador'),
('role.coach', 'Entrenador', 'Coach', 'Entraîneur', 'Trainer', 'Allenatore', 'Treinador'),
('role.athlete', 'Deportista', 'Athlete', 'Athlète', 'Athlet', 'Atleta', 'Atleta'),
('role.delegate', 'Delegado', 'Delegate', 'Délégué', 'Delegierter', 'Delegato', 'Delegado'),
('role.leader', 'Líder', 'Leader', 'Leader', 'Leiter', 'Leader', 'Líder'),
('role.finance', 'Finanzas', 'Finance', 'Finances', 'Finanzen', 'Finanze', 'Finanças'),
('role.user', 'Usuario', 'User', 'Utilisateur', 'Benutzer', 'Utente', 'Usuário'),

-- Common
('common.loading', 'Cargando...', 'Loading...', 'Chargement...', 'Laden...', 'Caricamento...', 'Carregando...'),
('common.error', 'Error', 'Error', 'Erreur', 'Fehler', 'Errore', 'Erro'),
('common.success', 'Éxito', 'Success', 'Succès', 'Erfolg', 'Successo', 'Sucesso'),
('common.warning', 'Advertencia', 'Warning', 'Avertissement', 'Warnung', 'Avviso', 'Aviso'),
('common.info', 'Información', 'Information', 'Information', 'Information', 'Informazione', 'Informação'),
('common.no_results', 'No se encontraron resultados', 'No results found', 'Aucun résultat trouvé', 'Keine Ergebnisse gefunden', 'Nessun risultato trovato', 'Nenhum resultado encontrado'),
('common.no_data', 'Sin datos', 'No data', 'Pas de données', 'Keine Daten', 'Nessun dato', 'Sem dados'),
('common.total', 'Total', 'Total', 'Total', 'Gesamt', 'Totale', 'Total'),
('common.yes', 'Sí', 'Yes', 'Oui', 'Ja', 'Sì', 'Sim'),
('common.no', 'No', 'No', 'Non', 'Nein', 'No', 'Não'),
('common.all', 'Todos', 'All', 'Tous', 'Alle', 'Tutti', 'Todos'),
('common.none', 'Ninguno', 'None', 'Aucun', 'Keine', 'Nessuno', 'Nenhum'),
('common.active', 'Activo', 'Active', 'Actif', 'Aktiv', 'Attivo', 'Ativo'),
('common.inactive', 'Inactivo', 'Inactive', 'Inactif', 'Inaktiv', 'Inattivo', 'Inativo'),
('common.pending', 'Pendiente', 'Pending', 'En attente', 'Ausstehend', 'In sospeso', 'Pendente'),
('common.completed', 'Completado', 'Completed', 'Terminé', 'Abgeschlossen', 'Completato', 'Concluído'),
('common.status', 'Estado', 'Status', 'Statut', 'Status', 'Stato', 'Status'),
('common.date', 'Fecha', 'Date', 'Date', 'Datum', 'Data', 'Data'),
('common.time', 'Hora', 'Time', 'Heure', 'Zeit', 'Ora', 'Hora'),
('common.name', 'Nombre', 'Name', 'Nom', 'Name', 'Nome', 'Nome'),
('common.email', 'Correo', 'Email', 'Email', 'E-Mail', 'Email', 'Email'),
('common.phone', 'Teléfono', 'Phone', 'Téléphone', 'Telefon', 'Telefono', 'Telefone'),
('common.address', 'Dirección', 'Address', 'Adresse', 'Adresse', 'Indirizzo', 'Endereço'),
('common.description', 'Descripción', 'Description', 'Description', 'Beschreibung', 'Descrizione', 'Descrição'),
('common.notes', 'Notas', 'Notes', 'Notes', 'Notizen', 'Note', 'Notas'),
('common.actions', 'Acciones', 'Actions', 'Actions', 'Aktionen', 'Azioni', 'Ações'),
('common.details', 'Detalles', 'Details', 'Détails', 'Details', 'Dettagli', 'Detalhes'),
('common.options', 'Opciones', 'Options', 'Options', 'Optionen', 'Opzioni', 'Opções'),

-- Form validations
('form.required', 'Este campo es requerido', 'This field is required', 'Ce champ est requis', 'Dieses Feld ist erforderlich', 'Questo campo è obbligatorio', 'Este campo é obrigatório'),
('form.invalid_email', 'Email inválido', 'Invalid email', 'Email invalide', 'Ungültige E-Mail', 'Email non valida', 'Email inválido'),
('form.password_min', 'La contraseña debe tener al menos 6 caracteres', 'Password must be at least 6 characters', 'Le mot de passe doit contenir au moins 6 caractères', 'Das Passwort muss mindestens 6 Zeichen lang sein', 'La password deve contenere almeno 6 caratteri', 'A senha deve ter pelo menos 6 caracteres'),
('form.passwords_not_match', 'Las contraseñas no coinciden', 'Passwords do not match', 'Les mots de passe ne correspondent pas', 'Die Passwörter stimmen nicht überein', 'Le password non corrispondono', 'As senhas não coincidem'),
('form.select_option', 'Selecciona una opción', 'Select an option', 'Sélectionnez une option', 'Wählen Sie eine Option', 'Seleziona un opzione', 'Selecione uma opção'),

-- Settings
('settings.title', 'Configuración', 'Settings', 'Paramètres', 'Einstellungen', 'Impostazioni', 'Configurações'),
('settings.language', 'Idioma', 'Language', 'Langue', 'Sprache', 'Lingua', 'Idioma'),
('settings.language_description', 'El idioma solo cambia la interfaz del sistema. No modifica datos de atletas, entrenadores o registros.', 'The language only changes the system interface. It does not modify athlete, coach, or record data.', 'La langue ne change que l interface du système. Elle ne modifie pas les données des athlètes, entraîneurs ou des enregistrements.', 'Die Sprache ändert nur die Systemoberfläche. Sie ändert keine Athleten-, Trainer- oder Aufzeichnungsdaten.', 'La lingua cambia solo l interfaccia del sistema. Non modifica i dati di atleti, allenatori o registrazioni.', 'O idioma só muda a interface do sistema. Não modifica dados de atletas, treinadores ou registros.'),
('settings.apply_language', 'Aplicar Idioma', 'Apply Language', 'Appliquer la langue', 'Sprache anwenden', 'Applica lingua', 'Aplicar Idioma'),
('settings.profile', 'Perfil', 'Profile', 'Profil', 'Profil', 'Profilo', 'Perfil'),
('settings.security', 'Seguridad', 'Security', 'Sécurité', 'Sicherheit', 'Sicurezza', 'Segurança'),
('settings.notifications', 'Notificaciones', 'Notifications', 'Notifications', 'Benachrichtigungen', 'Notifiche', 'Notificações'),
('settings.preferences', 'Preferencias', 'Preferences', 'Préférences', 'Präferenzen', 'Preferenze', 'Preferências'),
('settings.system', 'Sistema', 'System', 'Système', 'System', 'Sistema', 'Sistema'),
('settings.user_management', 'Gestión de Usuarios', 'User Management', 'Gestion des utilisateurs', 'Benutzerverwaltung', 'Gestione utenti', 'Gerenciamento de Usuários'),

-- Login
('login.title', 'Iniciar Sesión', 'Login', 'Connexion', 'Anmelden', 'Accedi', 'Entrar'),
('login.email', 'Correo electrónico', 'Email', 'Email', 'E-Mail', 'Email', 'Email'),
('login.password', 'Contraseña', 'Password', 'Mot de passe', 'Passwort', 'Password', 'Senha'),
('login.forgot_password', '¿Olvidaste tu contraseña?', 'Forgot password?', 'Mot de passe oublié?', 'Passwort vergessen?', 'Password dimenticata?', 'Esqueceu a senha?'),
('login.submit', 'Iniciar Sesión', 'Sign In', 'Se connecter', 'Anmelden', 'Accedi', 'Entrar'),
('login.signing_in', 'Iniciando sesión...', 'Signing in...', 'Connexion en cours...', 'Anmelden...', 'Accesso in corso...', 'Entrando...'),
('login.welcome', 'Bienvenido', 'Welcome', 'Bienvenue', 'Willkommen', 'Benvenuto', 'Bem-vindo'),
('login.error', 'Error al iniciar sesión', 'Login error', 'Erreur de connexion', 'Anmeldefehler', 'Errore di accesso', 'Erro ao entrar'),

-- Messages
('message.saved_successfully', 'Guardado exitosamente', 'Saved successfully', 'Enregistré avec succès', 'Erfolgreich gespeichert', 'Salvato con successo', 'Salvo com sucesso'),
('message.deleted_successfully', 'Eliminado exitosamente', 'Deleted successfully', 'Supprimé avec succès', 'Erfolgreich gelöscht', 'Eliminato con successo', 'Excluído com sucesso'),
('message.updated_successfully', 'Actualizado exitosamente', 'Updated successfully', 'Mis à jour avec succès', 'Erfolgreich aktualisiert', 'Aggiornato con successo', 'Atualizado com sucesso'),
('message.created_successfully', 'Creado exitosamente', 'Created successfully', 'Créé avec succès', 'Erfolgreich erstellt', 'Creato con successo', 'Criado com sucesso'),
('message.error_occurred', 'Ocurrió un error', 'An error occurred', 'Une erreur s est produite', 'Ein Fehler ist aufgetreten', 'Si è verificato un errore', 'Ocorreu um erro'),
('message.confirm_delete', '¿Estás seguro de que deseas eliminar?', 'Are you sure you want to delete?', 'Êtes-vous sûr de vouloir supprimer?', 'Sind Sie sicher, dass Sie löschen möchten?', 'Sei sicuro di voler eliminare?', 'Tem certeza de que deseja excluir?'),
('message.language_updated', 'Idioma actualizado correctamente', 'Language updated successfully', 'Langue mise à jour avec succès', 'Sprache erfolgreich aktualisiert', 'Lingua aggiornata con successo', 'Idioma atualizado com sucesso'),

-- Athletes
('athletes.title', 'Deportistas', 'Athletes', 'Athlètes', 'Athleten', 'Atleti', 'Atletas'),
('athletes.add', 'Agregar Deportista', 'Add Athlete', 'Ajouter un athlète', 'Athlet hinzufügen', 'Aggiungi atleta', 'Adicionar Atleta'),
('athletes.edit', 'Editar Deportista', 'Edit Athlete', 'Modifier l athlète', 'Athlet bearbeiten', 'Modifica atleta', 'Editar Atleta'),
('athletes.delete', 'Eliminar Deportista', 'Delete Athlete', 'Supprimer l athlète', 'Athlet löschen', 'Elimina atleta', 'Excluir Atleta'),
('athletes.category', 'Categoría', 'Category', 'Catégorie', 'Kategorie', 'Categoria', 'Categoria'),
('athletes.level', 'Nivel', 'Level', 'Niveau', 'Niveau', 'Livello', 'Nível'),
('athletes.gender', 'Género', 'Gender', 'Genre', 'Geschlecht', 'Genere', 'Gênero'),
('athletes.age', 'Edad', 'Age', 'Âge', 'Alter', 'Età', 'Idade'),
('athletes.total', 'Total Deportistas', 'Total Athletes', 'Total athlètes', 'Athleten insgesamt', 'Totale atleti', 'Total de Atletas'),

-- Training
('training.title', 'Entrenamientos', 'Training', 'Entraînements', 'Training', 'Allenamenti', 'Treinos'),
('training.add', 'Agregar Entrenamiento', 'Add Training', 'Ajouter un entraînement', 'Training hinzufügen', 'Aggiungi allenamento', 'Adicionar Treino'),
('training.edit', 'Editar Entrenamiento', 'Edit Training', 'Modifier l entraînement', 'Training bearbeiten', 'Modifica allenamento', 'Editar Treino'),
('training.attendance', 'Asistencia', 'Attendance', 'Présence', 'Anwesenheit', 'Presenza', 'Presença'),
('training.session', 'Sesión', 'Session', 'Séance', 'Sitzung', 'Sessione', 'Sessão'),
('training.schedule', 'Horario', 'Schedule', 'Horaire', 'Zeitplan', 'Orario', 'Horário'),
('training.location', 'Ubicación', 'Location', 'Lieu', 'Ort', 'Luogo', 'Local'),
('training.type', 'Tipo', 'Type', 'Type', 'Typ', 'Tipo', 'Tipo'),

-- Competitions
('competitions.title', 'Competencias', 'Competitions', 'Compétitions', 'Wettbewerbe', 'Competizioni', 'Competições'),
('competitions.add', 'Agregar Competencia', 'Add Competition', 'Ajouter une compétition', 'Wettbewerb hinzufügen', 'Aggiungi competizione', 'Adicionar Competição'),
('competitions.edit', 'Editar Competencia', 'Edit Competition', 'Modifier la compétition', 'Wettbewerb bearbeiten', 'Modifica competizione', 'Editar Competição'),
('competitions.results', 'Resultados', 'Results', 'Résultats', 'Ergebnisse', 'Risultati', 'Resultados'),
('competitions.medals', 'Medallas', 'Medals', 'Médailles', 'Medaillen', 'Medaglie', 'Medalhas'),
('competitions.upcoming', 'Próximas', 'Upcoming', 'À venir', 'Anstehend', 'In arrivo', 'Próximas'),
('competitions.past', 'Pasadas', 'Past', 'Passées', 'Vergangen', 'Passate', 'Passadas'),

-- Finance
('finance.title', 'Finanzas', 'Finance', 'Finances', 'Finanzen', 'Finanze', 'Finanças'),
('finance.transactions', 'Transacciones', 'Transactions', 'Transactions', 'Transaktionen', 'Transazioni', 'Transações'),
('finance.income', 'Ingresos', 'Income', 'Revenus', 'Einnahmen', 'Entrate', 'Receitas'),
('finance.expenses', 'Gastos', 'Expenses', 'Dépenses', 'Ausgaben', 'Spese', 'Despesas'),
('finance.payments', 'Pagos', 'Payments', 'Paiements', 'Zahlungen', 'Pagamenti', 'Pagamentos'),
('finance.pending', 'Pendientes', 'Pending', 'En attente', 'Ausstehend', 'In sospeso', 'Pendentes'),
('finance.paid', 'Pagado', 'Paid', 'Payé', 'Bezahlt', 'Pagato', 'Pago'),
('finance.overdue', 'Vencido', 'Overdue', 'En retard', 'Überfällig', 'Scaduto', 'Vencido'),

-- Reports
('reports.title', 'Reportes', 'Reports', 'Rapports', 'Berichte', 'Report', 'Relatórios'),
('reports.generate', 'Generar Reporte', 'Generate Report', 'Générer un rapport', 'Bericht erstellen', 'Genera report', 'Gerar Relatório'),
('reports.download', 'Descargar Reporte', 'Download Report', 'Télécharger le rapport', 'Bericht herunterladen', 'Scarica report', 'Baixar Relatório'),

-- Dashboard
('dashboard.title', 'Dashboard', 'Dashboard', 'Tableau de bord', 'Dashboard', 'Dashboard', 'Painel'),
('dashboard.welcome', 'Bienvenido', 'Welcome', 'Bienvenue', 'Willkommen', 'Benvenuto', 'Bem-vindo'),
('dashboard.quick_actions', 'Acciones Rápidas', 'Quick Actions', 'Actions rapides', 'Schnellaktionen', 'Azioni rapide', 'Ações Rápidas'),
('dashboard.recent_activity', 'Actividad Reciente', 'Recent Activity', 'Activité récente', 'Letzte Aktivität', 'Attività recente', 'Atividade Recente'),
('dashboard.statistics', 'Estadísticas', 'Statistics', 'Statistiques', 'Statistiken', 'Statistiche', 'Estatísticas'),
('dashboard.overview', 'Resumen', 'Overview', 'Aperçu', 'Übersicht', 'Panoramica', 'Visão Geral'),

-- Calendar
('calendar.title', 'Calendario', 'Calendar', 'Calendrier', 'Kalender', 'Calendario', 'Calendário'),
('calendar.today', 'Hoy', 'Today', 'Aujourd hui', 'Heute', 'Oggi', 'Hoje'),
('calendar.week', 'Semana', 'Week', 'Semaine', 'Woche', 'Settimana', 'Semana'),
('calendar.month', 'Mes', 'Month', 'Mois', 'Monat', 'Mese', 'Mês'),
('calendar.day', 'Día', 'Day', 'Jour', 'Tag', 'Giorno', 'Dia'),

-- Users
('users.title', 'Usuarios', 'Users', 'Utilisateurs', 'Benutzer', 'Utenti', 'Usuários'),
('users.add', 'Agregar Usuario', 'Add User', 'Ajouter un utilisateur', 'Benutzer hinzufügen', 'Aggiungi utente', 'Adicionar Usuário'),
('users.edit', 'Editar Usuario', 'Edit User', 'Modifier l utilisateur', 'Benutzer bearbeiten', 'Modifica utente', 'Editar Usuário'),
('users.role', 'Rol', 'Role', 'Rôle', 'Rolle', 'Ruolo', 'Função'),
('users.status', 'Estado', 'Status', 'Statut', 'Status', 'Stato', 'Status'),

-- Table headers
('table.name', 'Nombre', 'Name', 'Nom', 'Name', 'Nome', 'Nome'),
('table.email', 'Correo', 'Email', 'Email', 'E-Mail', 'Email', 'Email'),
('table.role', 'Rol', 'Role', 'Rôle', 'Rolle', 'Ruolo', 'Função'),
('table.status', 'Estado', 'Status', 'Statut', 'Status', 'Stato', 'Status'),
('table.date', 'Fecha', 'Date', 'Date', 'Datum', 'Data', 'Data'),
('table.actions', 'Acciones', 'Actions', 'Actions', 'Aktionen', 'Azioni', 'Ações'),
('table.amount', 'Monto', 'Amount', 'Montant', 'Betrag', 'Importo', 'Valor'),
('table.category', 'Categoría', 'Category', 'Catégorie', 'Kategorie', 'Categoria', 'Categoria'),

-- Pagination
('pagination.previous', 'Anterior', 'Previous', 'Précédent', 'Zurück', 'Precedente', 'Anterior'),
('pagination.next', 'Siguiente', 'Next', 'Suivant', 'Weiter', 'Successivo', 'Próximo'),
('pagination.showing', 'Mostrando', 'Showing', 'Affichage', 'Zeigt', 'Visualizzazione', 'Mostrando'),
('pagination.of', 'de', 'of', 'de', 'von', 'di', 'de'),
('pagination.results', 'resultados', 'results', 'résultats', 'Ergebnisse', 'risultati', 'resultados')

ON CONFLICT (key) DO UPDATE SET
  es = EXCLUDED.es,
  en = EXCLUDED.en,
  fr = EXCLUDED.fr,
  de = EXCLUDED.de,
  it = EXCLUDED.it,
  pt = EXCLUDED.pt,
  updated_at = now();