-- Insert financial transactions to populate revenue metrics
INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    120.00,
    'Cuota mensual julio',
    'registration_fee'::transaction_type,
    '2024-07-01',
    'paid'::payment_status
FROM athletes a
WHERE a.athlete_number IN ('ATH001', 'ATH002', 'ATH003', 'ATH004', 'ATH005', 'ATH006', 'ATH007', 'ATH008', 'ATH009', 'ATH010');

INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    120.00,
    'Cuota mensual junio',
    'registration_fee'::transaction_type,
    '2024-06-01',
    'paid'::payment_status
FROM athletes a
WHERE a.athlete_number IN ('ATH011', 'ATH012', 'ATH013', 'ATH014', 'ATH015', 'ATH016', 'ATH017', 'ATH021', 'ATH022', 'ATH023');

INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    25.00,
    'Inscripción Torneo Nacional',
    'other'::transaction_type,
    '2024-05-15',
    'paid'::payment_status
FROM athletes a
WHERE a.athlete_number IN ('ATH012', 'ATH014', 'ATH016', 'ATH017');

INSERT INTO financial_transactions (athlete_id, amount, description, transaction_type, transaction_date, payment_status) 
SELECT 
    a.id,
    45.00,
    'Equipamiento nuevo',
    'equipment'::transaction_type,
    '2024-06-20',
    'paid'::payment_status
FROM athletes a
WHERE a.athlete_number IN ('ATH001', 'ATH005', 'ATH008', 'ATH011');