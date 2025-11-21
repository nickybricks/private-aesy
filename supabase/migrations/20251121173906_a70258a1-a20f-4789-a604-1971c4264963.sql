-- Create key_metrics table for annual and quarterly data
CREATE TABLE IF NOT EXISTS public.key_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  fiscal_year TEXT,
  reported_currency TEXT NOT NULL,
  
  -- Market and Enterprise metrics (with currency conversions)
  market_cap_orig NUMERIC,
  market_cap_usd NUMERIC,
  market_cap_eur NUMERIC,
  enterprise_value_orig NUMERIC,
  enterprise_value_usd NUMERIC,
  enterprise_value_eur NUMERIC,
  
  -- Valuation ratios
  ev_to_sales NUMERIC,
  ev_to_operating_cash_flow NUMERIC,
  ev_to_free_cash_flow NUMERIC,
  ev_to_ebitda NUMERIC,
  net_debt_to_ebitda NUMERIC,
  
  -- Liquidity and quality metrics
  current_ratio NUMERIC,
  income_quality NUMERIC,
  graham_number NUMERIC,
  graham_net_net NUMERIC,
  
  -- Burden metrics
  tax_burden NUMERIC,
  interest_burden NUMERIC,
  
  -- Working capital and invested capital (with currency conversions)
  working_capital_orig NUMERIC,
  working_capital_usd NUMERIC,
  working_capital_eur NUMERIC,
  invested_capital_orig NUMERIC,
  invested_capital_usd NUMERIC,
  invested_capital_eur NUMERIC,
  
  -- Return metrics
  return_on_assets NUMERIC,
  operating_return_on_assets NUMERIC,
  return_on_tangible_assets NUMERIC,
  return_on_equity NUMERIC,
  return_on_invested_capital NUMERIC,
  return_on_capital_employed NUMERIC,
  
  -- Yield metrics
  earnings_yield NUMERIC,
  free_cash_flow_yield NUMERIC,
  
  -- Capex metrics
  capex_to_operating_cash_flow NUMERIC,
  capex_to_depreciation NUMERIC,
  capex_to_revenue NUMERIC,
  
  -- Expense ratios
  sales_general_and_administrative_to_revenue NUMERIC,
  research_and_developement_to_revenue NUMERIC,
  stock_based_compensation_to_revenue NUMERIC,
  intangibles_to_total_assets NUMERIC,
  
  -- Average metrics (with currency conversions)
  average_receivables_orig NUMERIC,
  average_receivables_usd NUMERIC,
  average_receivables_eur NUMERIC,
  average_payables_orig NUMERIC,
  average_payables_usd NUMERIC,
  average_payables_eur NUMERIC,
  average_inventory_orig NUMERIC,
  average_inventory_usd NUMERIC,
  average_inventory_eur NUMERIC,
  
  -- Days metrics
  days_of_sales_outstanding NUMERIC,
  days_of_payables_outstanding NUMERIC,
  days_of_inventory_outstanding NUMERIC,
  operating_cycle NUMERIC,
  cash_conversion_cycle NUMERIC,
  
  -- Free cash flow metrics (with currency conversions)
  free_cash_flow_to_equity_orig NUMERIC,
  free_cash_flow_to_equity_usd NUMERIC,
  free_cash_flow_to_equity_eur NUMERIC,
  free_cash_flow_to_firm_orig NUMERIC,
  free_cash_flow_to_firm_usd NUMERIC,
  free_cash_flow_to_firm_eur NUMERIC,
  tangible_asset_value_orig NUMERIC,
  tangible_asset_value_usd NUMERIC,
  tangible_asset_value_eur NUMERIC,
  net_current_asset_value_orig NUMERIC,
  net_current_asset_value_usd NUMERIC,
  net_current_asset_value_eur NUMERIC,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  UNIQUE(symbol, date, period)
);

-- Create financial_ratios table for annual and quarterly data
CREATE TABLE IF NOT EXISTS public.financial_ratios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  fiscal_year TEXT,
  reported_currency TEXT NOT NULL,
  
  -- Margin ratios
  gross_profit_margin NUMERIC,
  ebit_margin NUMERIC,
  ebitda_margin NUMERIC,
  operating_profit_margin NUMERIC,
  pretax_profit_margin NUMERIC,
  continuous_operations_profit_margin NUMERIC,
  net_profit_margin NUMERIC,
  bottom_line_profit_margin NUMERIC,
  
  -- Turnover ratios
  receivables_turnover NUMERIC,
  payables_turnover NUMERIC,
  inventory_turnover NUMERIC,
  fixed_asset_turnover NUMERIC,
  asset_turnover NUMERIC,
  
  -- Liquidity ratios
  current_ratio NUMERIC,
  quick_ratio NUMERIC,
  solvency_ratio NUMERIC,
  cash_ratio NUMERIC,
  
  -- Valuation ratios
  price_to_earnings_ratio NUMERIC,
  price_to_earnings_growth_ratio NUMERIC,
  forward_price_to_earnings_growth_ratio NUMERIC,
  price_to_book_ratio NUMERIC,
  price_to_sales_ratio NUMERIC,
  price_to_free_cash_flow_ratio NUMERIC,
  price_to_operating_cash_flow_ratio NUMERIC,
  
  -- Debt ratios
  debt_to_assets_ratio NUMERIC,
  debt_to_equity_ratio NUMERIC,
  debt_to_capital_ratio NUMERIC,
  long_term_debt_to_capital_ratio NUMERIC,
  financial_leverage_ratio NUMERIC,
  
  -- Working capital ratios
  working_capital_turnover_ratio NUMERIC,
  
  -- Cash flow ratios
  operating_cash_flow_ratio NUMERIC,
  operating_cash_flow_sales_ratio NUMERIC,
  free_cash_flow_operating_cash_flow_ratio NUMERIC,
  
  -- Coverage ratios
  debt_service_coverage_ratio NUMERIC,
  interest_coverage_ratio NUMERIC,
  short_term_operating_cash_flow_coverage_ratio NUMERIC,
  operating_cash_flow_coverage_ratio NUMERIC,
  capital_expenditure_coverage_ratio NUMERIC,
  dividend_paid_and_capex_coverage_ratio NUMERIC,
  
  -- Dividend ratios
  dividend_payout_ratio NUMERIC,
  dividend_yield NUMERIC,
  dividend_yield_percentage NUMERIC,
  
  -- Per share metrics
  revenue_per_share NUMERIC,
  net_income_per_share NUMERIC,
  interest_debt_per_share NUMERIC,
  cash_per_share NUMERIC,
  book_value_per_share NUMERIC,
  tangible_book_value_per_share NUMERIC,
  shareholders_equity_per_share NUMERIC,
  operating_cash_flow_per_share NUMERIC,
  capex_per_share NUMERIC,
  free_cash_flow_per_share NUMERIC,
  
  -- Other ratios
  net_income_per_ebt NUMERIC,
  ebt_per_ebit NUMERIC,
  price_to_fair_value NUMERIC,
  debt_to_market_cap NUMERIC,
  effective_tax_rate NUMERIC,
  enterprise_value_multiple NUMERIC,
  dividend_per_share NUMERIC,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  UNIQUE(symbol, date, period)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_key_metrics_symbol_date ON public.key_metrics(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_key_metrics_symbol_period ON public.key_metrics(symbol, period);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_symbol_date ON public.financial_ratios(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_symbol_period ON public.financial_ratios(symbol, period);

-- Enable RLS
ALTER TABLE public.key_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ratios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read key metrics" ON public.key_metrics
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert key metrics" ON public.key_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update key metrics" ON public.key_metrics
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete key metrics" ON public.key_metrics
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read financial ratios" ON public.financial_ratios
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert financial ratios" ON public.financial_ratios
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update financial ratios" ON public.financial_ratios
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete financial ratios" ON public.financial_ratios
  FOR DELETE USING (auth.role() = 'service_role');

-- Add triggers for updated_at
CREATE TRIGGER update_key_metrics_updated_at
  BEFORE UPDATE ON public.key_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_ratios_updated_at
  BEFORE UPDATE ON public.financial_ratios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();