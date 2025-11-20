-- Add comprehensive Income Statement, Balance Sheet, and Cash Flow fields to financial_statements table
-- This migration adds ~186 new columns to store complete financial data from FMP API

-- ============================================================================
-- INCOME STATEMENT FIELDS
-- ============================================================================

-- Basic Income Statement fields (with currency variants)
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cost_of_revenue_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cost_of_revenue_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cost_of_revenue_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS gross_profit_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS gross_profit_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS gross_profit_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS operating_expenses_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS operating_expenses_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS operating_expenses_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS selling_general_and_administrative_expenses_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS selling_general_and_administrative_expenses_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS selling_general_and_administrative_expenses_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_income_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_income_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_income_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_interest_income_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_interest_income_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_interest_income_eur NUMERIC;

-- Cash Flow depreciation (separate from Income Statement)
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS depreciation_and_amortization_cf_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS depreciation_and_amortization_cf_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS depreciation_and_amortization_cf_eur NUMERIC;

-- Share and earnings data (no currency conversion needed)
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS weighted_average_shs_out NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS eps_basic NUMERIC;

-- Income Statement metadata
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cik TEXT;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS filing_date DATE;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accepted_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS fiscal_year TEXT;

-- ============================================================================
-- BALANCE SHEET FIELDS
-- ============================================================================

-- Assets
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_investments_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_and_short_term_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_and_short_term_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_and_short_term_investments_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_receivables_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_receivables_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_receivables_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivable_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivable_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivable_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_assets_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_assets_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_assets_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS property_plant_equipment_net_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS property_plant_equipment_net_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS property_plant_equipment_net_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS goodwill_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS goodwill_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS goodwill_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_investments_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_assets_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_assets_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_assets_eur NUMERIC;

-- Liabilities
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payable_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payable_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payable_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_debt_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_debt_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_debt_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_debt_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_debt_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_debt_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_liabilities_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_liabilities_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_current_liabilities_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_liabilities_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_liabilities_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_non_current_liabilities_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_liabilities_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_liabilities_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_liabilities_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_current_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_current_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_current_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_non_current_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_non_current_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_revenue_non_current_eur NUMERIC;

-- Equity
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS retained_earnings_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS retained_earnings_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS retained_earnings_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accumulated_other_comprehensive_income_loss_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accumulated_other_comprehensive_income_loss_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accumulated_other_comprehensive_income_loss_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS treasury_stock_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS treasury_stock_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS treasury_stock_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS preferred_stock_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS preferred_stock_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS preferred_stock_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS minority_interest_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS minority_interest_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS minority_interest_eur NUMERIC;

-- Calculated Balance Sheet fields
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS total_investments_eur NUMERIC;

-- ============================================================================
-- CASH FLOW STATEMENT FIELDS
-- ============================================================================

-- Operating Activities
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS stock_based_compensation_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS stock_based_compensation_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS stock_based_compensation_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS change_in_working_capital_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS change_in_working_capital_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS change_in_working_capital_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivables_change_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivables_change_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_receivables_change_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_change_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_change_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS inventory_change_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payables_change_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payables_change_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS accounts_payables_change_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_working_capital_change_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_working_capital_change_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_working_capital_change_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_income_tax_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_income_tax_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS deferred_income_tax_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_non_cash_items_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_non_cash_items_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_non_cash_items_eur NUMERIC;

-- Investing Activities
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS investments_in_ppe_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS investments_in_ppe_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS investments_in_ppe_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS acquisitions_net_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS acquisitions_net_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS acquisitions_net_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS purchases_of_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS purchases_of_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS purchases_of_investments_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS sales_maturities_of_investments_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS sales_maturities_of_investments_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS sales_maturities_of_investments_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_investing_activities_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_investing_activities_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_investing_activities_eur NUMERIC;

-- Financing Activities
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_debt_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_net_debt_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_net_debt_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS long_term_net_debt_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_net_debt_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_net_debt_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS short_term_net_debt_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_repurchased_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_repurchased_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_repurchased_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS common_stock_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_common_stock_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_common_stock_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_common_stock_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_preferred_stock_issuance_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_preferred_stock_issuance_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_preferred_stock_issuance_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_financing_activities_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_financing_activities_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS other_financing_activities_eur NUMERIC;

-- Cash Changes and Forex
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS effect_of_forex_changes_on_cash_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS effect_of_forex_changes_on_cash_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS effect_of_forex_changes_on_cash_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_beginning_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_beginning_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_beginning_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_end_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_end_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS cash_at_end_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_change_in_cash_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_change_in_cash_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS net_change_in_cash_eur NUMERIC;

-- Tax and Interest Payments
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS income_taxes_paid_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS income_taxes_paid_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS income_taxes_paid_eur NUMERIC;

ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_paid_orig NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_paid_usd NUMERIC;
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS interest_paid_eur NUMERIC;

-- Add comment to table documenting the comprehensive data structure
COMMENT ON TABLE financial_statements IS 'Comprehensive financial data from FMP API including Income Statement, Balance Sheet, and Cash Flow Statement for both quarterly and annual periods. All monetary values stored in original currency (_orig), USD (_usd), and EUR (_eur) variants.';
