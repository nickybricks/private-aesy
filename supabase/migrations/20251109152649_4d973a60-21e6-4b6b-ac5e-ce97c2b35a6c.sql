-- Drop existing table if it exists
DROP TABLE IF EXISTS public.precomputed_metrics CASCADE;

-- Create precomputed_metrics table for storing calculated stock metrics
CREATE TABLE public.precomputed_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  currency TEXT NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Graham Number (currency-specific)
  graham_number_usd NUMERIC,
  graham_number_eur NUMERIC,
  graham_number_orig NUMERIC,
  
  -- Price Changes
  price_change_5d NUMERIC,
  price_change_1m NUMERIC,
  price_change_3m NUMERIC,
  price_change_6m NUMERIC,
  price_change_1y NUMERIC,
  price_change_ytd NUMERIC,
  price_change_3y NUMERIC,
  price_change_5y NUMERIC,
  price_change_10y NUMERIC,
  price_change_max NUMERIC,
  
  -- Valuation Ratios
  pe_ratio NUMERIC,
  ps_ratio NUMERIC,
  pb_ratio NUMERIC,
  p_fcf_ratio NUMERIC,
  p_ocf_ratio NUMERIC,
  
  -- Net Income (currency-specific)
  net_income_usd NUMERIC,
  net_income_eur NUMERIC,
  net_income_orig NUMERIC,
  net_income_growth_yoy NUMERIC,
  net_income_growth_qoq NUMERIC,
  net_income_growth_3y_cagr NUMERIC,
  net_income_growth_5y_cagr NUMERIC,
  net_income_growth_years INTEGER,
  net_income_growth_quarters INTEGER,
  net_income_profitable_10years INTEGER,
  net_income_profitable_20years INTEGER,
  
  -- EPS (currency-specific)
  eps_diluted_usd NUMERIC,
  eps_diluted_eur NUMERIC,
  eps_diluted_orig NUMERIC,
  eps_growth_yoy NUMERIC,
  eps_growth_qoq NUMERIC,
  eps_growth_3y_cagr NUMERIC,
  eps_growth_5y_cagr NUMERIC,
  eps_growth_years INTEGER,
  eps_growth_quarters INTEGER,
  
  -- EBIT Growth
  ebit_growth_yoy NUMERIC,
  ebit_growth_qoq NUMERIC,
  ebit_growth_3y_cagr NUMERIC,
  ebit_growth_5y_cagr NUMERIC,
  ebit_growth_10y_cagr NUMERIC,
  
  -- EBITDA (currency-specific)
  ebitda_usd NUMERIC,
  ebitda_eur NUMERIC,
  ebitda_orig NUMERIC,
  
  -- Profitability Metrics
  gross_profit_usd NUMERIC,
  gross_profit_eur NUMERIC,
  gross_profit_orig NUMERIC,
  gross_margin NUMERIC,
  operating_margin NUMERIC,
  pretax_margin NUMERIC,
  profit_margin NUMERIC,
  fcf_margin NUMERIC,
  ebitda_margin NUMERIC,
  ebit_margin NUMERIC,
  
  -- Free Cash Flow
  fcf_per_share NUMERIC,
  fcf_growth_yoy NUMERIC,
  fcf_growth_qoq NUMERIC,
  fcf_growth_3y_cagr NUMERIC,
  fcf_growth_5y_cagr NUMERIC,
  
  -- R&D
  rnd_expenses_usd NUMERIC,
  rnd_expenses_eur NUMERIC,
  rnd_expenses_orig NUMERIC,
  rnd_to_revenue_ratio NUMERIC,
  
  -- Debt Metrics
  debt_growth_yoy NUMERIC,
  debt_growth_qoq NUMERIC,
  debt_growth_3y_cagr NUMERIC,
  debt_growth_5y_cagr NUMERIC,
  
  -- Net Cash
  net_cash_usd NUMERIC,
  net_cash_eur NUMERIC,
  net_cash_orig NUMERIC,
  net_cash_growth_yoy NUMERIC,
  cash_to_market_cap NUMERIC,
  
  -- Liquidity Ratios
  current_ratio NUMERIC,
  quick_ratio NUMERIC,
  
  -- Leverage Ratios
  debt_to_equity NUMERIC,
  debt_to_ebitda NUMERIC,
  debt_to_fcf NUMERIC,
  interest_coverage NUMERIC,
  
  -- Book Value Per Share
  bvps NUMERIC,
  tbvps NUMERIC,
  
  -- Working Capital
  working_capital NUMERIC,
  working_capital_turnover NUMERIC,
  
  -- Return Ratios
  roe NUMERIC,
  roa NUMERIC,
  roic NUMERIC,
  roce NUMERIC,
  roe_5y_avg NUMERIC,
  roa_5y_avg NUMERIC,
  roic_5y_avg NUMERIC,
  
  -- Efficiency Metrics
  revenue_per_employee NUMERIC,
  profits_per_employee NUMERIC,
  
  -- Tax Metrics
  tax_to_revenue_ratio NUMERIC,
  
  CONSTRAINT precomputed_metrics_stock_date_unique UNIQUE (stock_id, calculation_date)
);

-- Create indexes for faster lookups
CREATE INDEX idx_precomputed_metrics_symbol ON public.precomputed_metrics(symbol);
CREATE INDEX idx_precomputed_metrics_calculation_date ON public.precomputed_metrics(calculation_date);
CREATE INDEX idx_precomputed_metrics_stock_id ON public.precomputed_metrics(stock_id);

-- Enable RLS
ALTER TABLE public.precomputed_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read precomputed metrics"
  ON public.precomputed_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert precomputed metrics"
  ON public.precomputed_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update precomputed metrics"
  ON public.precomputed_metrics
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete precomputed metrics"
  ON public.precomputed_metrics
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_precomputed_metrics_updated_at
  BEFORE UPDATE ON public.precomputed_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();