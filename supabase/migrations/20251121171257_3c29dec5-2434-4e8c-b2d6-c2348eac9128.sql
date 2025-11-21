-- Drop old financial_statements table
DROP TABLE IF EXISTS financial_statements CASCADE;

-- Create income_statements table
CREATE TABLE income_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  reported_currency TEXT NOT NULL,
  cik TEXT,
  filing_date DATE,
  accepted_date TIMESTAMP,
  fiscal_year TEXT,
  
  -- Income Statement fields with currency conversions
  revenue_orig NUMERIC,
  revenue_usd NUMERIC,
  revenue_eur NUMERIC,
  cost_of_revenue_orig NUMERIC,
  cost_of_revenue_usd NUMERIC,
  cost_of_revenue_eur NUMERIC,
  gross_profit_orig NUMERIC,
  gross_profit_usd NUMERIC,
  gross_profit_eur NUMERIC,
  research_and_development_expenses_orig NUMERIC,
  research_and_development_expenses_usd NUMERIC,
  research_and_development_expenses_eur NUMERIC,
  general_and_administrative_expenses_orig NUMERIC,
  general_and_administrative_expenses_usd NUMERIC,
  general_and_administrative_expenses_eur NUMERIC,
  selling_and_marketing_expenses_orig NUMERIC,
  selling_and_marketing_expenses_usd NUMERIC,
  selling_and_marketing_expenses_eur NUMERIC,
  selling_general_and_administrative_expenses_orig NUMERIC,
  selling_general_and_administrative_expenses_usd NUMERIC,
  selling_general_and_administrative_expenses_eur NUMERIC,
  other_expenses_orig NUMERIC,
  other_expenses_usd NUMERIC,
  other_expenses_eur NUMERIC,
  operating_expenses_orig NUMERIC,
  operating_expenses_usd NUMERIC,
  operating_expenses_eur NUMERIC,
  cost_and_expenses_orig NUMERIC,
  cost_and_expenses_usd NUMERIC,
  cost_and_expenses_eur NUMERIC,
  net_interest_income_orig NUMERIC,
  net_interest_income_usd NUMERIC,
  net_interest_income_eur NUMERIC,
  interest_income_orig NUMERIC,
  interest_income_usd NUMERIC,
  interest_income_eur NUMERIC,
  interest_expense_orig NUMERIC,
  interest_expense_usd NUMERIC,
  interest_expense_eur NUMERIC,
  depreciation_and_amortization_orig NUMERIC,
  depreciation_and_amortization_usd NUMERIC,
  depreciation_and_amortization_eur NUMERIC,
  ebitda_orig NUMERIC,
  ebitda_usd NUMERIC,
  ebitda_eur NUMERIC,
  ebit_orig NUMERIC,
  ebit_usd NUMERIC,
  ebit_eur NUMERIC,
  non_operating_income_excluding_interest_orig NUMERIC,
  non_operating_income_excluding_interest_usd NUMERIC,
  non_operating_income_excluding_interest_eur NUMERIC,
  operating_income_orig NUMERIC,
  operating_income_usd NUMERIC,
  operating_income_eur NUMERIC,
  total_other_income_expenses_net_orig NUMERIC,
  total_other_income_expenses_net_usd NUMERIC,
  total_other_income_expenses_net_eur NUMERIC,
  income_before_tax_orig NUMERIC,
  income_before_tax_usd NUMERIC,
  income_before_tax_eur NUMERIC,
  income_tax_expense_orig NUMERIC,
  income_tax_expense_usd NUMERIC,
  income_tax_expense_eur NUMERIC,
  net_income_from_continuing_operations_orig NUMERIC,
  net_income_from_continuing_operations_usd NUMERIC,
  net_income_from_continuing_operations_eur NUMERIC,
  net_income_from_discontinued_operations_orig NUMERIC,
  net_income_from_discontinued_operations_usd NUMERIC,
  net_income_from_discontinued_operations_eur NUMERIC,
  other_adjustments_to_net_income_orig NUMERIC,
  other_adjustments_to_net_income_usd NUMERIC,
  other_adjustments_to_net_income_eur NUMERIC,
  net_income_orig NUMERIC,
  net_income_usd NUMERIC,
  net_income_eur NUMERIC,
  net_income_deductions_orig NUMERIC,
  net_income_deductions_usd NUMERIC,
  net_income_deductions_eur NUMERIC,
  bottom_line_net_income_orig NUMERIC,
  bottom_line_net_income_usd NUMERIC,
  bottom_line_net_income_eur NUMERIC,
  
  -- Non-currency fields
  eps NUMERIC,
  eps_diluted NUMERIC,
  weighted_average_shs_out NUMERIC,
  weighted_average_shs_out_dil NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, date, period)
);

-- Create indexes for income_statements
CREATE INDEX idx_income_statements_symbol ON income_statements(symbol);
CREATE INDEX idx_income_statements_date ON income_statements(date);
CREATE INDEX idx_income_statements_symbol_date ON income_statements(symbol, date);

-- Enable RLS for income_statements
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read income statements"
  ON income_statements FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert income statements"
  ON income_statements FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update income statements"
  ON income_statements FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete income statements"
  ON income_statements FOR DELETE
  USING (auth.role() = 'service_role');

-- Create trigger for income_statements
CREATE TRIGGER update_income_statements_updated_at
  BEFORE UPDATE ON income_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create balance_sheets table
CREATE TABLE balance_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  reported_currency TEXT NOT NULL,
  cik TEXT,
  filing_date DATE,
  accepted_date TIMESTAMP,
  fiscal_year TEXT,
  
  -- Assets
  cash_and_cash_equivalents_orig NUMERIC,
  cash_and_cash_equivalents_usd NUMERIC,
  cash_and_cash_equivalents_eur NUMERIC,
  short_term_investments_orig NUMERIC,
  short_term_investments_usd NUMERIC,
  short_term_investments_eur NUMERIC,
  cash_and_short_term_investments_orig NUMERIC,
  cash_and_short_term_investments_usd NUMERIC,
  cash_and_short_term_investments_eur NUMERIC,
  net_receivables_orig NUMERIC,
  net_receivables_usd NUMERIC,
  net_receivables_eur NUMERIC,
  accounts_receivables_orig NUMERIC,
  accounts_receivables_usd NUMERIC,
  accounts_receivables_eur NUMERIC,
  other_receivables_orig NUMERIC,
  other_receivables_usd NUMERIC,
  other_receivables_eur NUMERIC,
  inventory_orig NUMERIC,
  inventory_usd NUMERIC,
  inventory_eur NUMERIC,
  prepaids_orig NUMERIC,
  prepaids_usd NUMERIC,
  prepaids_eur NUMERIC,
  other_current_assets_orig NUMERIC,
  other_current_assets_usd NUMERIC,
  other_current_assets_eur NUMERIC,
  total_current_assets_orig NUMERIC,
  total_current_assets_usd NUMERIC,
  total_current_assets_eur NUMERIC,
  property_plant_equipment_net_orig NUMERIC,
  property_plant_equipment_net_usd NUMERIC,
  property_plant_equipment_net_eur NUMERIC,
  goodwill_orig NUMERIC,
  goodwill_usd NUMERIC,
  goodwill_eur NUMERIC,
  intangible_assets_orig NUMERIC,
  intangible_assets_usd NUMERIC,
  intangible_assets_eur NUMERIC,
  goodwill_and_intangible_assets_orig NUMERIC,
  goodwill_and_intangible_assets_usd NUMERIC,
  goodwill_and_intangible_assets_eur NUMERIC,
  long_term_investments_orig NUMERIC,
  long_term_investments_usd NUMERIC,
  long_term_investments_eur NUMERIC,
  tax_assets_orig NUMERIC,
  tax_assets_usd NUMERIC,
  tax_assets_eur NUMERIC,
  other_non_current_assets_orig NUMERIC,
  other_non_current_assets_usd NUMERIC,
  other_non_current_assets_eur NUMERIC,
  total_non_current_assets_orig NUMERIC,
  total_non_current_assets_usd NUMERIC,
  total_non_current_assets_eur NUMERIC,
  other_assets_orig NUMERIC,
  other_assets_usd NUMERIC,
  other_assets_eur NUMERIC,
  total_assets_orig NUMERIC,
  total_assets_usd NUMERIC,
  total_assets_eur NUMERIC,
  
  -- Liabilities
  total_payables_orig NUMERIC,
  total_payables_usd NUMERIC,
  total_payables_eur NUMERIC,
  account_payables_orig NUMERIC,
  account_payables_usd NUMERIC,
  account_payables_eur NUMERIC,
  other_payables_orig NUMERIC,
  other_payables_usd NUMERIC,
  other_payables_eur NUMERIC,
  accrued_expenses_orig NUMERIC,
  accrued_expenses_usd NUMERIC,
  accrued_expenses_eur NUMERIC,
  short_term_debt_orig NUMERIC,
  short_term_debt_usd NUMERIC,
  short_term_debt_eur NUMERIC,
  capital_lease_obligations_current_orig NUMERIC,
  capital_lease_obligations_current_usd NUMERIC,
  capital_lease_obligations_current_eur NUMERIC,
  tax_payables_orig NUMERIC,
  tax_payables_usd NUMERIC,
  tax_payables_eur NUMERIC,
  deferred_revenue_orig NUMERIC,
  deferred_revenue_usd NUMERIC,
  deferred_revenue_eur NUMERIC,
  other_current_liabilities_orig NUMERIC,
  other_current_liabilities_usd NUMERIC,
  other_current_liabilities_eur NUMERIC,
  total_current_liabilities_orig NUMERIC,
  total_current_liabilities_usd NUMERIC,
  total_current_liabilities_eur NUMERIC,
  long_term_debt_orig NUMERIC,
  long_term_debt_usd NUMERIC,
  long_term_debt_eur NUMERIC,
  capital_lease_obligations_non_current_orig NUMERIC,
  capital_lease_obligations_non_current_usd NUMERIC,
  capital_lease_obligations_non_current_eur NUMERIC,
  deferred_revenue_non_current_orig NUMERIC,
  deferred_revenue_non_current_usd NUMERIC,
  deferred_revenue_non_current_eur NUMERIC,
  deferred_tax_liabilities_non_current_orig NUMERIC,
  deferred_tax_liabilities_non_current_usd NUMERIC,
  deferred_tax_liabilities_non_current_eur NUMERIC,
  other_non_current_liabilities_orig NUMERIC,
  other_non_current_liabilities_usd NUMERIC,
  other_non_current_liabilities_eur NUMERIC,
  total_non_current_liabilities_orig NUMERIC,
  total_non_current_liabilities_usd NUMERIC,
  total_non_current_liabilities_eur NUMERIC,
  other_liabilities_orig NUMERIC,
  other_liabilities_usd NUMERIC,
  other_liabilities_eur NUMERIC,
  capital_lease_obligations_orig NUMERIC,
  capital_lease_obligations_usd NUMERIC,
  capital_lease_obligations_eur NUMERIC,
  total_liabilities_orig NUMERIC,
  total_liabilities_usd NUMERIC,
  total_liabilities_eur NUMERIC,
  
  -- Equity
  treasury_stock_orig NUMERIC,
  treasury_stock_usd NUMERIC,
  treasury_stock_eur NUMERIC,
  preferred_stock_orig NUMERIC,
  preferred_stock_usd NUMERIC,
  preferred_stock_eur NUMERIC,
  common_stock_orig NUMERIC,
  common_stock_usd NUMERIC,
  common_stock_eur NUMERIC,
  retained_earnings_orig NUMERIC,
  retained_earnings_usd NUMERIC,
  retained_earnings_eur NUMERIC,
  additional_paid_in_capital_orig NUMERIC,
  additional_paid_in_capital_usd NUMERIC,
  additional_paid_in_capital_eur NUMERIC,
  accumulated_other_comprehensive_income_loss_orig NUMERIC,
  accumulated_other_comprehensive_income_loss_usd NUMERIC,
  accumulated_other_comprehensive_income_loss_eur NUMERIC,
  other_total_stockholders_equity_orig NUMERIC,
  other_total_stockholders_equity_usd NUMERIC,
  other_total_stockholders_equity_eur NUMERIC,
  total_stockholders_equity_orig NUMERIC,
  total_stockholders_equity_usd NUMERIC,
  total_stockholders_equity_eur NUMERIC,
  total_equity_orig NUMERIC,
  total_equity_usd NUMERIC,
  total_equity_eur NUMERIC,
  minority_interest_orig NUMERIC,
  minority_interest_usd NUMERIC,
  minority_interest_eur NUMERIC,
  
  -- Calculated fields
  total_liabilities_and_total_equity_orig NUMERIC,
  total_liabilities_and_total_equity_usd NUMERIC,
  total_liabilities_and_total_equity_eur NUMERIC,
  total_investments_orig NUMERIC,
  total_investments_usd NUMERIC,
  total_investments_eur NUMERIC,
  total_debt_orig NUMERIC,
  total_debt_usd NUMERIC,
  total_debt_eur NUMERIC,
  net_debt_orig NUMERIC,
  net_debt_usd NUMERIC,
  net_debt_eur NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, date, period)
);

-- Create indexes for balance_sheets
CREATE INDEX idx_balance_sheets_symbol ON balance_sheets(symbol);
CREATE INDEX idx_balance_sheets_date ON balance_sheets(date);
CREATE INDEX idx_balance_sheets_symbol_date ON balance_sheets(symbol, date);

-- Enable RLS for balance_sheets
ALTER TABLE balance_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read balance sheets"
  ON balance_sheets FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert balance sheets"
  ON balance_sheets FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update balance sheets"
  ON balance_sheets FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete balance sheets"
  ON balance_sheets FOR DELETE
  USING (auth.role() = 'service_role');

-- Create trigger for balance_sheets
CREATE TRIGGER update_balance_sheets_updated_at
  BEFORE UPDATE ON balance_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create cash_flow_statements table
CREATE TABLE cash_flow_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT NOT NULL,
  reported_currency TEXT NOT NULL,
  cik TEXT,
  filing_date DATE,
  accepted_date TIMESTAMP,
  fiscal_year TEXT,
  
  -- Operating Activities
  net_income_orig NUMERIC,
  net_income_usd NUMERIC,
  net_income_eur NUMERIC,
  depreciation_and_amortization_orig NUMERIC,
  depreciation_and_amortization_usd NUMERIC,
  depreciation_and_amortization_eur NUMERIC,
  deferred_income_tax_orig NUMERIC,
  deferred_income_tax_usd NUMERIC,
  deferred_income_tax_eur NUMERIC,
  stock_based_compensation_orig NUMERIC,
  stock_based_compensation_usd NUMERIC,
  stock_based_compensation_eur NUMERIC,
  change_in_working_capital_orig NUMERIC,
  change_in_working_capital_usd NUMERIC,
  change_in_working_capital_eur NUMERIC,
  accounts_receivables_orig NUMERIC,
  accounts_receivables_usd NUMERIC,
  accounts_receivables_eur NUMERIC,
  inventory_orig NUMERIC,
  inventory_usd NUMERIC,
  inventory_eur NUMERIC,
  accounts_payables_orig NUMERIC,
  accounts_payables_usd NUMERIC,
  accounts_payables_eur NUMERIC,
  other_working_capital_orig NUMERIC,
  other_working_capital_usd NUMERIC,
  other_working_capital_eur NUMERIC,
  other_non_cash_items_orig NUMERIC,
  other_non_cash_items_usd NUMERIC,
  other_non_cash_items_eur NUMERIC,
  net_cash_provided_by_operating_activities_orig NUMERIC,
  net_cash_provided_by_operating_activities_usd NUMERIC,
  net_cash_provided_by_operating_activities_eur NUMERIC,
  
  -- Investing Activities
  investments_in_property_plant_and_equipment_orig NUMERIC,
  investments_in_property_plant_and_equipment_usd NUMERIC,
  investments_in_property_plant_and_equipment_eur NUMERIC,
  acquisitions_net_orig NUMERIC,
  acquisitions_net_usd NUMERIC,
  acquisitions_net_eur NUMERIC,
  purchases_of_investments_orig NUMERIC,
  purchases_of_investments_usd NUMERIC,
  purchases_of_investments_eur NUMERIC,
  sales_maturities_of_investments_orig NUMERIC,
  sales_maturities_of_investments_usd NUMERIC,
  sales_maturities_of_investments_eur NUMERIC,
  other_investing_activities_orig NUMERIC,
  other_investing_activities_usd NUMERIC,
  other_investing_activities_eur NUMERIC,
  net_cash_provided_by_investing_activities_orig NUMERIC,
  net_cash_provided_by_investing_activities_usd NUMERIC,
  net_cash_provided_by_investing_activities_eur NUMERIC,
  
  -- Financing Activities
  net_debt_issuance_orig NUMERIC,
  net_debt_issuance_usd NUMERIC,
  net_debt_issuance_eur NUMERIC,
  long_term_net_debt_issuance_orig NUMERIC,
  long_term_net_debt_issuance_usd NUMERIC,
  long_term_net_debt_issuance_eur NUMERIC,
  short_term_net_debt_issuance_orig NUMERIC,
  short_term_net_debt_issuance_usd NUMERIC,
  short_term_net_debt_issuance_eur NUMERIC,
  net_stock_issuance_orig NUMERIC,
  net_stock_issuance_usd NUMERIC,
  net_stock_issuance_eur NUMERIC,
  net_common_stock_issuance_orig NUMERIC,
  net_common_stock_issuance_usd NUMERIC,
  net_common_stock_issuance_eur NUMERIC,
  common_stock_issuance_orig NUMERIC,
  common_stock_issuance_usd NUMERIC,
  common_stock_issuance_eur NUMERIC,
  common_stock_repurchased_orig NUMERIC,
  common_stock_repurchased_usd NUMERIC,
  common_stock_repurchased_eur NUMERIC,
  net_preferred_stock_issuance_orig NUMERIC,
  net_preferred_stock_issuance_usd NUMERIC,
  net_preferred_stock_issuance_eur NUMERIC,
  net_dividends_paid_orig NUMERIC,
  net_dividends_paid_usd NUMERIC,
  net_dividends_paid_eur NUMERIC,
  common_dividends_paid_orig NUMERIC,
  common_dividends_paid_usd NUMERIC,
  common_dividends_paid_eur NUMERIC,
  preferred_dividends_paid_orig NUMERIC,
  preferred_dividends_paid_usd NUMERIC,
  preferred_dividends_paid_eur NUMERIC,
  other_financing_activities_orig NUMERIC,
  other_financing_activities_usd NUMERIC,
  other_financing_activities_eur NUMERIC,
  net_cash_provided_by_financing_activities_orig NUMERIC,
  net_cash_provided_by_financing_activities_usd NUMERIC,
  net_cash_provided_by_financing_activities_eur NUMERIC,
  
  -- Cash Summary
  effect_of_forex_changes_on_cash_orig NUMERIC,
  effect_of_forex_changes_on_cash_usd NUMERIC,
  effect_of_forex_changes_on_cash_eur NUMERIC,
  net_change_in_cash_orig NUMERIC,
  net_change_in_cash_usd NUMERIC,
  net_change_in_cash_eur NUMERIC,
  cash_at_end_of_period_orig NUMERIC,
  cash_at_end_of_period_usd NUMERIC,
  cash_at_end_of_period_eur NUMERIC,
  cash_at_beginning_of_period_orig NUMERIC,
  cash_at_beginning_of_period_usd NUMERIC,
  cash_at_beginning_of_period_eur NUMERIC,
  operating_cash_flow_orig NUMERIC,
  operating_cash_flow_usd NUMERIC,
  operating_cash_flow_eur NUMERIC,
  capital_expenditure_orig NUMERIC,
  capital_expenditure_usd NUMERIC,
  capital_expenditure_eur NUMERIC,
  free_cash_flow_orig NUMERIC,
  free_cash_flow_usd NUMERIC,
  free_cash_flow_eur NUMERIC,
  income_taxes_paid_orig NUMERIC,
  income_taxes_paid_usd NUMERIC,
  income_taxes_paid_eur NUMERIC,
  interest_paid_orig NUMERIC,
  interest_paid_usd NUMERIC,
  interest_paid_eur NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, date, period)
);

-- Create indexes for cash_flow_statements
CREATE INDEX idx_cash_flow_statements_symbol ON cash_flow_statements(symbol);
CREATE INDEX idx_cash_flow_statements_date ON cash_flow_statements(date);
CREATE INDEX idx_cash_flow_statements_symbol_date ON cash_flow_statements(symbol, date);

-- Enable RLS for cash_flow_statements
ALTER TABLE cash_flow_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cash flow statements"
  ON cash_flow_statements FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert cash flow statements"
  ON cash_flow_statements FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update cash flow statements"
  ON cash_flow_statements FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete cash flow statements"
  ON cash_flow_statements FOR DELETE
  USING (auth.role() = 'service_role');

-- Create trigger for cash_flow_statements
CREATE TRIGGER update_cash_flow_statements_updated_at
  BEFORE UPDATE ON cash_flow_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();