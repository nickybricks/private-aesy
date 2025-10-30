-- Tabelle für Aktien-Metadaten
CREATE TABLE IF NOT EXISTS public.stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  country VARCHAR(50),
  exchange VARCHAR(50),
  currency VARCHAR(10),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnelle Symbol-Suche
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON public.stocks(symbol);

-- Tabelle für historische Finanzdaten
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES public.stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period VARCHAR(10) NOT NULL,
  revenue NUMERIC,
  ebitda NUMERIC,
  ebit NUMERIC,
  net_income NUMERIC,
  eps_diluted NUMERIC,
  weighted_avg_shares_dil NUMERIC,
  total_current_assets NUMERIC,
  total_assets NUMERIC,
  total_current_liabilities NUMERIC,
  total_debt NUMERIC,
  total_stockholders_equity NUMERIC,
  cash_and_equivalents NUMERIC,
  interest_expense NUMERIC,
  operating_cash_flow NUMERIC,
  capital_expenditure NUMERIC,
  free_cash_flow NUMERIC,
  dividends_paid NUMERIC,
  other_adjustments_net_income NUMERIC,
  income_tax_expense NUMERIC,
  income_before_tax NUMERIC,
  UNIQUE(stock_id, date, period)
);

-- Index für schnelle Abfragen nach Stock und Datum
CREATE INDEX IF NOT EXISTS idx_financial_stock_date ON public.financial_statements(stock_id, date DESC);

-- Tabelle für vorberechnete Metriken
CREATE TABLE IF NOT EXISTS public.precomputed_metrics (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES public.stocks(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value NUMERIC,
  calculation_date DATE NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, metric_type, calculation_date)
);

-- Index für schnelle Metrik-Abfragen
CREATE INDEX IF NOT EXISTS idx_precomputed_stock_metric ON public.precomputed_metrics(stock_id, metric_type);

-- Tabelle für Branchen-Durchschnitte
CREATE TABLE IF NOT EXISTS public.industry_averages (
  id SERIAL PRIMARY KEY,
  industry VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value NUMERIC,
  calculation_date DATE NOT NULL,
  UNIQUE(industry, metric_type, calculation_date)
);

-- RLS aktivieren für alle Tabellen
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precomputed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_averages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Jeder kann lesen, nur Service Role kann schreiben

-- Stocks Policies
CREATE POLICY "Anyone can read stocks"
  ON public.stocks
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert stocks"
  ON public.stocks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update stocks"
  ON public.stocks
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete stocks"
  ON public.stocks
  FOR DELETE
  USING (true);

-- Financial Statements Policies
CREATE POLICY "Anyone can read financial statements"
  ON public.financial_statements
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert financial statements"
  ON public.financial_statements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update financial statements"
  ON public.financial_statements
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete financial statements"
  ON public.financial_statements
  FOR DELETE
  USING (true);

-- Precomputed Metrics Policies
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

-- Industry Averages Policies
CREATE POLICY "Anyone can read industry averages"
  ON public.industry_averages
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert industry averages"
  ON public.industry_averages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update industry averages"
  ON public.industry_averages
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete industry averages"
  ON public.industry_averages
  FOR DELETE
  USING (true);