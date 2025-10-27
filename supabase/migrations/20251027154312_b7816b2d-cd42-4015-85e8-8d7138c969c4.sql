-- Create company_profiles table for non-quarterly company data
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  
  -- Basic Information
  company_name TEXT,
  exchange TEXT,
  currency TEXT,
  country TEXT,
  sector TEXT,
  industry TEXT,
  
  -- Management & Structure
  ceo TEXT,
  full_time_employees INTEGER,
  website TEXT,
  description TEXT,
  
  -- IPO & Listing
  ipo_date DATE,
  isin TEXT,
  cusip TEXT,
  
  -- Shares & Float
  shares_outstanding NUMERIC(20,4),
  float_shares NUMERIC(20,4),
  
  -- Risk Metrics
  beta NUMERIC(8,4),
  
  -- Market Data (current)
  market_cap NUMERIC(20,4),
  current_price NUMERIC(12,4),
  
  -- Raw Data
  raw_profile_data JSONB,
  
  -- Audit
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for company_profiles
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company profiles"
  ON public.company_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert company profiles"
  ON public.company_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update company profiles"
  ON public.company_profiles
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete company profiles"
  ON public.company_profiles
  FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_profiles_symbol ON public.company_profiles(symbol);

-- Extend financial_data_quarterly table with new ratio columns
ALTER TABLE public.financial_data_quarterly
  ADD COLUMN IF NOT EXISTS market_cap NUMERIC(20,4),
  ADD COLUMN IF NOT EXISTS enterprise_value NUMERIC(20,4),
  
  -- Valuation Ratios
  ADD COLUMN IF NOT EXISTS pe_ratio NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS pb_ratio NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS ps_ratio NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS pfcf_ratio NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS peg_ratio NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS ev_to_ebitda NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS ev_to_sales NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS ev_to_operating_cash_flow NUMERIC(12,4),
  
  -- Profitability Ratios
  ADD COLUMN IF NOT EXISTS gross_profit_margin NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS operating_profit_margin NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS net_profit_margin NUMERIC(8,4),
  
  -- Return Ratios
  ADD COLUMN IF NOT EXISTS return_on_assets NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS return_on_equity NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS return_on_invested_capital NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS return_on_capital_employed NUMERIC(8,4),
  
  -- Liquidity Ratios
  ADD COLUMN IF NOT EXISTS current_ratio NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS quick_ratio NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS cash_ratio NUMERIC(8,4),
  
  -- Leverage Ratios
  ADD COLUMN IF NOT EXISTS debt_to_equity NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS debt_to_assets NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS net_debt_to_ebitda NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS interest_coverage NUMERIC(8,4),
  
  -- Efficiency Ratios
  ADD COLUMN IF NOT EXISTS asset_turnover NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS inventory_turnover NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS receivables_turnover NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS days_sales_outstanding NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS days_inventory_outstanding NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS days_payables_outstanding NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS cash_conversion_cycle NUMERIC(8,4),
  
  -- Shareholder Metrics
  ADD COLUMN IF NOT EXISTS payout_ratio NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS dividend_yield NUMERIC(8,4),
  
  -- Raw Data for Ratios
  ADD COLUMN IF NOT EXISTS raw_key_metrics JSONB,
  ADD COLUMN IF NOT EXISTS raw_ratios JSONB;