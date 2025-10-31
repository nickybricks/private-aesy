-- Remove unnecessary currency columns (_gbp, _jpy, _aud, _cny, _mxn, _dkk) and add _eur columns

-- Revenue
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS revenue_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS revenue_eur NUMERIC;

-- EBITDA
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebitda_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS ebitda_eur NUMERIC;

-- EBIT
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS ebit_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS ebit_eur NUMERIC;

-- Net Income
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS net_income_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_income_eur NUMERIC;

-- EPS Diluted
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS eps_diluted_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS eps_diluted_eur NUMERIC;

-- Total Current Assets
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_assets_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_current_assets_eur NUMERIC;

-- Total Assets
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_assets_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_assets_eur NUMERIC;

-- Total Current Liabilities
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_current_liabilities_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_current_liabilities_eur NUMERIC;

-- Total Debt
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_debt_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_debt_eur NUMERIC;

-- Total Stockholders Equity
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS total_stockholders_equity_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_stockholders_equity_eur NUMERIC;

-- Cash and Equivalents
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS cash_and_equivalents_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_and_equivalents_eur NUMERIC;

-- Interest Expense
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS interest_expense_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_expense_eur NUMERIC;

-- Operating Cash Flow
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS operating_cash_flow_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS operating_cash_flow_eur NUMERIC;

-- Capital Expenditure
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS capital_expenditure_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS capital_expenditure_eur NUMERIC;

-- Free Cash Flow
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS free_cash_flow_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS free_cash_flow_eur NUMERIC;

-- Dividends Paid
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS dividends_paid_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS dividends_paid_eur NUMERIC;

-- Other Adjustments to Net Income
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS other_adjustments_net_income_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_adjustments_net_income_eur NUMERIC;

-- Income Tax Expense
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_tax_expense_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS income_tax_expense_eur NUMERIC;

-- Income Before Tax
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_gbp;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_jpy;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_aud;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_cny;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_mxn;
ALTER TABLE financial_statements DROP COLUMN IF EXISTS income_before_tax_dkk;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS income_before_tax_eur NUMERIC;