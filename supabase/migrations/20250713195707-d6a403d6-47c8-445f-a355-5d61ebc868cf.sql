-- Generate synthetic data for enhanced sports club dashboard (final corrected version)

-- Insert sample athletes with age-based categories
INSERT INTO athletes (first_name, last_name, email, athlete_number, category, level, status, join_date, performance_score) VALUES
-- School age (6-12)
('Emma', 'Rodriguez', 'emma.rodriguez@email.com', 'ATH001', 'youth', 'beginner', 'active', '2024-01-15', 75),
('Lucas', 'Martinez', 'lucas.martinez@email.com', 'ATH002', 'youth', 'intermediate', 'active', '2024-02-01', 82),
('Sofia', 'Garcia', 'sofia.garcia@email.com', 'ATH003', 'youth', 'beginner', 'active', '2024-01-20', 68),
('Diego', 'Lopez', 'diego.lopez@email.com', 'ATH004', 'youth', 'intermediate', 'active', '2024-03-10', 78),
('Isabella', 'Hernandez', 'isabella.hernandez@email.com', 'ATH005', 'youth', 'advanced', 'active', '2023-11-15', 88),

-- Juniors (13-15)
('Alejandro', 'Gonzalez', 'alejandro.gonzalez@email.com', 'ATH006', 'junior', 'intermediate', 'active', '2023-09-05', 85),
('Valentina', 'Perez', 'valentina.perez@email.com', 'ATH007', 'junior', 'advanced', 'active', '2023-08-12', 92),
('Mateo', 'Sanchez', 'mateo.sanchez@email.com', 'ATH008', 'junior', 'professional', 'active', '2023-06-20', 96),
('Camila', 'Ramirez', 'camila.ramirez@email.com', 'ATH009', 'junior', 'advanced', 'active', '2023-10-03', 89),
('Gabriel', 'Torres', 'gabriel.torres@email.com', 'ATH010', 'junior', 'intermediate', 'active', '2024-01-08', 83),

-- Transition (16-17) and Seniors (18+)
('Maria', 'Flores', 'maria.flores@email.com', 'ATH011', 'senior', 'advanced', 'active', '2023-05-14', 94),
('Sebastian', 'Rivera', 'sebastian.rivera@email.com', 'ATH012', 'senior', 'professional', 'active', '2023-04-22', 98),
('Ana', 'Castro', 'ana.castro@email.com', 'ATH013', 'senior', 'advanced', 'active', '2023-07-08', 91),
('Pablo', 'Morales', 'pablo.morales@email.com', 'ATH014', 'senior', 'professional', 'active', '2022-12-15', 97),
('Lucia', 'Ortega', 'lucia.ortega@email.com', 'ATH015', 'senior', 'advanced', 'active', '2023-03-25', 90),
('Carlos', 'Vargas', 'carlos.vargas@email.com', 'ATH016', 'senior', 'professional', 'active', '2022-08-10', 99),
('Andrea', 'Ramos', 'andrea.ramos@email.com', 'ATH017', 'senior', 'professional', 'active', '2022-09-18', 95),

-- Masters (25+)
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

-- Insert training attendance records
INSERT INTO training_attendance (athlete_id, training_session_id, attended, performance_rating, notes) 
SELECT 
    a.id,
    ts.id,
    CASE WHEN random() > 0.15 THEN true ELSE false END, -- 85% attendance rate
    FLOOR(random() * 4 + 7)::integer, -- Rating between 7-10
    CASE 
        WHEN random() > 0.7 THEN 'Excelente progreso'
        WHEN random() > 0.4 THEN 'Buen rendimiento'
        ELSE NULL
    END
FROM athletes a
CROSS JOIN training_sessions ts
WHERE random() > 0.3; -- Some athletes don't attend all sessions

-- Insert competitions
INSERT INTO competitions (name, start_date, end_date, location, description, category, level, status, entry_fee, prize_pool, max_participants) VALUES
('Campeonato Regional de Primavera', '2024-04-15', '2024-04-16', 'Polideportivo Municipal', 'Competencia regional para todas las categorías', 'senior', 'advanced', 'completed', 25.00, 1500.00, 50),
('Copa Juvenil de Velocidad', '2024-05-20', '2024-05-20', 'Pista Central', 'Competencia de velocidad para jóvenes', 'youth', 'intermediate', 'completed', 15.00, 800.00, 30),
('Torneo Nacional Senior', '2024-06-10', '2024-06-12', 'Arena Deportiva Nacional', 'Torneo nacional de alto nivel', 'senior', 'professional', 'completed', 50.00, 5000.00, 40),
('Campeonato de Verano', '2024-08-15', '2024-08-16', 'Complejo Deportivo', 'Competencia de temporada de verano', 'junior', 'advanced', 'upcoming', 20.00, 1200.00, 35),
('Liga Metropolitana', '2024-09-05', '2024-09-07', 'Centro de Patinaje', 'Liga metropolitana anual', 'senior', 'professional', 'upcoming', 40.00, 3000.00, 25);

-- Insert competition results
INSERT INTO competition_results (athlete_id, competition_id, position, score, points, notes)
SELECT 
    a.id,
    c.id,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY random()),
    ROUND((random() * 50 + 50)::numeric, 2), -- Scores between 50-100
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY random()) = 1 THEN 100
        WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY random()) = 2 THEN 80
        WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY random()) = 3 THEN 60
        ELSE GREATEST(40 - ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY random()) * 2, 0)
    END,
    CASE 
        WHEN random() > 0.8 THEN 'Excelente performance'
        WHEN random() > 0.6 THEN 'Buen resultado'
        ELSE NULL
    END
FROM athletes a
CROSS JOIN competitions c
WHERE c.status = 'completed' AND random() > 0.4; -- Not all athletes compete in all competitions

-- Insert awards based on competition results (with correct award types)
INSERT INTO awards (athlete_id, competition_id, award_name, award_type, award_date, points_earned)
SELECT 
    cr.athlete_id,
    cr.competition_id,
    CASE 
        WHEN cr.position = 1 THEN 'Medalla de Oro'
        WHEN cr.position = 2 THEN 'Medalla de Plata'
        WHEN cr.position = 3 THEN 'Medalla de Bronce'
        ELSE 'Certificado de Participación'
    END,
    CASE 
        WHEN cr.position = 1 THEN 'gold'
        WHEN cr.position = 2 THEN 'silver'
        WHEN cr.position = 3 THEN 'bronze'
        ELSE 'participation'
    END,
    c.end_date,
    cr.points
FROM competition_results cr
JOIN competitions c ON cr.competition_id = c.id
WHERE cr.position <= 10; -- Awards for top 10

-- Insert financial transactions with proper enum casting
INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    120.00,
    'Cuota mensual',
    'registration_fee'::transaction_type,
    CURRENT_DATE - INTERVAL '1 day' * FLOOR(random() * 90),
    CASE WHEN random() > 0.1 THEN 'paid'::payment_status ELSE 'pending'::payment_status END
FROM athletes a
WHERE random() > 0.3
UNION ALL
SELECT 
    a.id,
    25.00,
    'Inscripción competencia',
    'other'::transaction_type,
    CURRENT_DATE - INTERVAL '1 day' * FLOOR(random() * 60),
    'paid'::payment_status
FROM athletes a
WHERE random() > 0.6
UNION ALL
SELECT 
    a.id,
    45.00,
    'Equipamiento',
    'equipment'::transaction_type,
    CURRENT_DATE - INTERVAL '1 day' * FLOOR(random() * 30),
    'paid'::payment_status
FROM athletes a
WHERE random() > 0.7;

-- Insert equipment records
INSERT INTO equipment (name, category, brand, model, condition, cost, purchase_date, assigned_to) VALUES
('Patines Profesionales', 'patines', 'SpeedMax', 'Pro 2024', 'excelente', 299.99, '2024-01-15', (SELECT id FROM athletes ORDER BY random() LIMIT 1)),
('Casco Protector', 'proteccion', 'SafeGuard', 'Elite V3', 'bueno', 89.99, '2023-11-20', (SELECT id FROM athletes ORDER BY random() LIMIT 1)),
('Rodilleras Pro', 'proteccion', 'FlexProtect', 'MaxGuard', 'excelente', 45.99, '2024-02-10', (SELECT id FROM athletes ORDER BY random() LIMIT 1)),
('Patines Entrenamiento', 'patines', 'TrainWell', 'Basic Plus', 'regular', 159.99, '2023-08-15', NULL);

-- Insert monthly targets
INSERT INTO monthly_targets (month, athlete_target, revenue_target, attendance_target, retention_target) VALUES
('2024-01-01', 150, 18000.00, 85.0, 95.0),
('2024-02-01', 155, 18500.00, 87.0, 94.0),
('2024-03-01', 160, 19000.00, 88.0, 95.0),
('2024-04-01', 165, 19500.00, 86.0, 93.0),
('2024-05-01', 170, 20000.00, 89.0, 96.0),
('2024-06-01', 175, 20500.00, 90.0, 95.0),
('2024-07-01', 180, 21000.00, 88.0, 94.0);

-- Insert sponsorships
INSERT INTO sponsorships (sponsor_name, sponsor_type, contract_value, start_date, end_date, contact_person, contact_email, status) VALUES
('Deportes González', 'equipamiento', 5000.00, '2024-01-01', '2024-12-31', 'Juan González', 'juan@deportesgonzalez.com', 'active'),
('Café Central', 'patrocinio', 2500.00, '2024-03-01', '2024-09-30', 'Maria López', 'maria@cafecentral.com', 'active'),
('TechSport', 'tecnologia', 3500.00, '2024-02-15', '2025-02-14', 'Carlos Tech', 'carlos@techsport.com', 'active');