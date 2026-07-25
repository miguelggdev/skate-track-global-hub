-- Add payer information fields to financial_transactions table
ALTER TABLE financial_transactions ADD COLUMN payer_name TEXT;
ALTER TABLE financial_transactions ADD COLUMN payer_identification TEXT;
ALTER TABLE financial_transactions ADD COLUMN payer_phone TEXT;
ALTER TABLE financial_transactions ADD COLUMN payer_email TEXT;