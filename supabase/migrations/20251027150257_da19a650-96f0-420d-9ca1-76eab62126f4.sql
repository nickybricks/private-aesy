-- Create financial_data_quarterly table
CREATE TABLE financial_data_quarterly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifikation
  symbol TEXT NOT NULL,
  fiscal_date DATE NOT NULL,
  calendar_year INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('Q1', 'Q2', 'Q3', 'Q4', 'FY', 'TTM')),
  is_ttm BOOLEAN DEFAULT false NOT NULL,
  
  -- Währung & FX
  reported_currency TEXT NOT NULL,
  fx_rate_to_usd NUMERIC(12,6),
  
  -- Income Statement (in reported_currency)
  net_income NUMERIC(20,4),
  revenue NUMERIC(20,4),
  ebit NUMERIC(20,4),
  ebitda NUMERIC(20,4),
  eps NUMERIC(12,4),
  eps_diluted NUMERIC(12,4),
  eps_wo_nri NUMERIC(12,4),
  interest_expense NUMERIC(20,4),
  income_before_tax NUMERIC(20,4),
  income_tax_expense NUMERIC(20,4),
  
  -- Non-recurring items
  unusual_items NUMERIC(20,4),
  goodwill_impairment NUMERIC(20,4),
  impairment_of_assets NUMERIC(20,4),
  restructuring_charges NUMERIC(20,4),
  
  -- Balance Sheet
  total_equity NUMERIC(20,4),
  total_assets NUMERIC(20,4),
  current_assets NUMERIC(20,4),
  total_debt NUMERIC(20,4),
  short_term_debt NUMERIC(20,4),
  long_term_debt NUMERIC(20,4),
  current_liabilities NUMERIC(20,4),
  cash_and_equivalents NUMERIC(20,4),
  book_value_per_share NUMERIC(12,4),
  
  -- Cash Flow
  operating_cash_flow NUMERIC(20,4),
  free_cash_flow NUMERIC(20,4),
  capex NUMERIC(20,4),
  
  -- Share Data
  weighted_avg_shares_diluted NUMERIC(20,4),
  dividend_per_share NUMERIC(12,4),
  
  -- Market Data
  stock_price_close NUMERIC(12,4),
  stock_price_date DATE,
  
  -- Calculated Metrics
  tax_rate NUMERIC(8,4),
  nopat NUMERIC(20,4),
  invested_capital NUMERIC(20,4),
  wacc NUMERIC(8,4),
  
  -- Data Quality
  data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  missing_fields TEXT[],
  data_source TEXT DEFAULT 'FMP' NOT NULL,
  fmp_filing_date DATE,
  
  -- Raw Data
  raw_data_income JSONB,
  raw_data_balance JSONB,
  raw_data_cashflow JSONB,
  raw_data_profile JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(symbol, fiscal_date, is_ttm),
  CHECK (
    (is_ttm = false AND period IN ('Q1', 'Q2', 'Q3', 'Q4', 'FY'))
    OR
    (is_ttm = true AND period = 'TTM')
  )
);

-- Optimized Indexes
CREATE INDEX idx_fin_data_symbol_date ON financial_data_quarterly(symbol, fiscal_date DESC);
CREATE INDEX idx_fin_data_ttm ON financial_data_quarterly(symbol, fiscal_date DESC) WHERE is_ttm = true;
CREATE INDEX idx_fin_data_period ON financial_data_quarterly(symbol, calendar_year, period) WHERE is_ttm = false;
CREATE INDEX idx_fin_data_date_range ON financial_data_quarterly(fiscal_date DESC, symbol);
CREATE INDEX idx_fin_data_quality ON financial_data_quarterly(data_quality_score) WHERE data_quality_score < 80;

-- RLS Policies
ALTER TABLE financial_data_quarterly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read financial data"
  ON financial_data_quarterly FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert financial data"
  ON financial_data_quarterly FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update financial data"
  ON financial_data_quarterly FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete financial data"
  ON financial_data_quarterly FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_financial_data_updated_at
  BEFORE UPDATE ON financial_data_quarterly
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create industry_metrics table
CREATE TABLE industry_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  exchange TEXT,
  date DATE NOT NULL,
  pe_ratio NUMERIC(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(industry, exchange, date)
);

CREATE INDEX idx_industry_industry_date ON industry_metrics(industry, date DESC);

-- RLS for industry_metrics
ALTER TABLE industry_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read industry metrics"
  ON industry_metrics FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert industry metrics"
  ON industry_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update industry metrics"
  ON industry_metrics FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete industry metrics"
  ON industry_metrics FOR DELETE
  USING (true);