-- Add beta and marketcap columns to financial_statements table
ALTER TABLE financial_statements
ADD COLUMN IF NOT EXISTS beta numeric,
ADD COLUMN IF NOT EXISTS market_cap numeric;