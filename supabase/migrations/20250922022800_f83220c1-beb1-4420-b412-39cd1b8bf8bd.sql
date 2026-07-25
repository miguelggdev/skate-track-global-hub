-- Update default currency to Colombian Peso in club_settings
UPDATE club_settings SET currency = 'COP' WHERE currency IS NULL OR currency IN ('EUR', 'USD', 'GBP');

-- For new records, ensure COP is the default
ALTER TABLE club_settings ALTER COLUMN currency SET DEFAULT 'COP';