-- Add full_time_employees and intangible_assets columns to financial_statements
ALTER TABLE public.financial_statements 
ADD COLUMN IF NOT EXISTS full_time_employees INTEGER,
ADD COLUMN IF NOT EXISTS intangible_assets_orig NUMERIC,
ADD COLUMN IF NOT EXISTS intangible_assets_usd NUMERIC,
ADD COLUMN IF NOT EXISTS intangible_assets_eur NUMERIC;