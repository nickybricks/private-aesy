-- Add new columns to stocks table for additional metadata
ALTER TABLE public.stocks
ADD COLUMN IF NOT EXISTS market_cap numeric,
ADD COLUMN IF NOT EXISTS isin text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS ceo text,
ADD COLUMN IF NOT EXISTS full_time_employees integer,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS ipo_date date,
ADD COLUMN IF NOT EXISTS is_etf boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_actively_trading boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_adr boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_fund boolean DEFAULT false;