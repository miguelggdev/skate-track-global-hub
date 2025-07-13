-- Insert basic sample data for the enhanced dashboard
INSERT INTO athletes (first_name, last_name, email, athlete_number, category, level, status, join_date, performance_score) VALUES
('Emma', 'Rodriguez', 'emma.rodriguez@email.com', 'ATH001', 'youth', 'beginner', 'active', '2024-01-15', 75),
('Lucas', 'Martinez', 'lucas.martinez@email.com', 'ATH002', 'youth', 'intermediate', 'active', '2024-02-01', 82),
('Sofia', 'Garcia', 'sofia.garcia@email.com', 'ATH003', 'youth', 'beginner', 'active', '2024-01-20', 68),
('Diego', 'Lopez', 'diego.lopez@email.com', 'ATH004', 'youth', 'intermediate', 'active', '2024-03-10', 78),
('Isabella', 'Hernandez', 'isabella.hernandez@email.com', 'ATH005', 'youth', 'advanced', 'active', '2023-11-15', 88),
('Alejandro', 'Gonzalez', 'alejandro.gonzalez@email.com', 'ATH006', 'junior', 'intermediate', 'active', '2023-09-05', 85),
('Valentina', 'Perez', 'valentina.perez@email.com', 'ATH007', 'junior', 'advanced', 'active', '2023-08-12', 92),
('Mateo', 'Sanchez', 'mateo.sanchez@email.com', 'ATH008', 'junior', 'professional', 'active', '2023-06-20', 96),
('Camila', 'Ramirez', 'camila.ramirez@email.com', 'ATH009', 'junior', 'advanced', 'active', '2023-10-03', 89),
('Gabriel', 'Torres', 'gabriel.torres@email.com', 'ATH010', 'junior', 'intermediate', 'active', '2024-01-08', 83),
('Maria', 'Flores', 'maria.flores@email.com', 'ATH011', 'senior', 'advanced', 'active', '2023-05-14', 94),
('Sebastian', 'Rivera', 'sebastian.rivera@email.com', 'ATH012', 'senior', 'professional', 'active', '2023-04-22', 98),
('Ana', 'Castro', 'ana.castro@email.com', 'ATH013', 'senior', 'advanced', 'active', '2023-07-08', 91),
('Pablo', 'Morales', 'pablo.morales@email.com', 'ATH014', 'senior', 'professional', 'active', '2022-12-15', 97),
('Lucia', 'Ortega', 'lucia.ortega@email.com', 'ATH015', 'senior', 'advanced', 'active', '2023-03-25', 90),
('Carlos', 'Vargas', 'carlos.vargas@email.com', 'ATH016', 'senior', 'professional', 'active', '2022-08-10', 99),
('Andrea', 'Ramos', 'andrea.ramos@email.com', 'ATH017', 'senior', 'professional', 'active', '2022-09-18', 95),
('Claudia', 'Moreno', 'claudia.moreno@email.com', 'ATH021', 'masters', 'advanced', 'active', '2022-06-05', 88),
('Roberto', 'Silva', 'roberto.silva@email.com', 'ATH022', 'masters', 'intermediate', 'active', '2023-04-18', 79),
('Patricia', 'Ruiz', 'patricia.ruiz@email.com', 'ATH023', 'masters', 'advanced', 'active', '2022-10-22', 84);

-- Insert training sessions
INSERT INTO training_sessions (name, date, start_time, end_time, training_type, description, location, max_participants) VALUES
('Entrenamiento Técnico Juvenil', '2024-07-15', '16:00', '18:00', 'technical', 'Entrenamiento enfocado en técnica básica para categoría juvenil', 'Pista Principal', 20),
('Preparación Física Senior', '2024-07-16', '18:30', '20:00', 'physical', 'Acondicionamiento físico para atletas senior', 'Gimnasio', 15),
('Entrenamiento Mental', '2024-07-17', '17:00', '18:30', 'mental', 'Sesión de concentración y mentalidad competitiva', 'Sala de Reuniones', 25),
('Recuperación Activa', '2024-07-18', '19:00', '20:00', 'recovery', 'Ejercicios de recuperación y estiramiento', 'Pista Secundaria', 30),
('Entrenamiento Técnico Senior', '2024-07-19', '17:30', '19:30', 'technical', 'Perfeccionamiento técnico para competidores senior', 'Pista Principal', 12);

-- Insert basic financial transactions
INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    120.00,
    'Cuota mensual',
    'registration_fee'::transaction_type,
    CURRENT_DATE - INTERVAL '1 day' * 30,
    'paid'::payment_status
FROM athletes a
LIMIT 10
UNION ALL
SELECT 
    a.id,
    25.00,
    'Inscripción competencia',
    'other'::transaction_type,
    CURRENT_DATE - INTERVAL '1 day' * 15,
    'paid'::payment_status
FROM athletes a
LIMIT 5;

-- Insert competitions
INSERT INTO competitions (name, start_date, end_date, location, description, category, level, status, entry_fee, prize_pool, max_participants) VALUES
('Campeonato Regional de Primavera', '2024-04-15', '2024-04-16', 'Polideportivo Municipal', 'Competencia regional para todas las categorías', 'senior', 'advanced', 'completed', 25.00, 1500.00, 50),
('Copa Juvenil de Velocidad', '2024-05-20', '2024-05-20', 'Pista Central', 'Competencia de velocidad para jóvenes', 'youth', 'intermediate', 'completed', 15.00, 800.00, 30),
('Torneo Nacional Senior', '2024-06-10', '2024-06-12', 'Arena Deportiva Nacional', 'Torneo nacional de alto nivel', 'senior', 'professional', 'completed', 50.00, 5000.00, 40),
('Campeonato de Verano', '2024-08-15', '2024-08-16', 'Complejo Deportivo', 'Competencia de temporada de verano', 'junior', 'advanced', 'upcoming', 20.00, 1200.00, 35),
('Liga Metropolitana', '2024-09-05', '2024-09-07', 'Centro de Patinaje', 'Liga metropolitana anual', 'senior', 'professional', 'upcoming', 40.00, 3000.00, 25);

-- Insert some awards
INSERT INTO awards (athlete_id, award_name, award_type, award_date, points_earned)
SELECT 
    a.id,
    'Medalla de Oro',
    'gold',
    '2024-06-12',
    100
FROM athletes a 
WHERE a.athlete_number IN ('ATH012', 'ATH016', 'ATH017')
UNION ALL
SELECT 
    a.id,
    'Medalla de Plata',
    'silver',
    '2024-06-12',
    80
FROM athletes a 
WHERE a.athlete_number IN ('ATH007', 'ATH014')
UNION ALL
SELECT 
    a.id,
    'Medalla de Bronce',
    'bronze',
    '2024-06-12',
    60
FROM athletes a 
WHERE a.athlete_number IN ('ATH008', 'ATH011', 'ATH013');