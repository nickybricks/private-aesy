-- Add all missing fields from FMP Income Statement API
ALTER TABLE financial_data_quarterly
ADD COLUMN IF NOT EXISTS net_interest_income NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS non_operating_income_excluding_interest NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_income_from_continuing_operations NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_income_from_discontinued_operations NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_adjustments_to_net_income NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_income_deductions NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS bottom_line_net_income NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS cost_of_revenue NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS research_and_development_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS general_and_administrative_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS selling_and_marketing_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS selling_general_and_administrative_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS operating_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS cost_and_expenses NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS interest_income NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS fiscal_year TEXT,
ADD COLUMN IF NOT EXISTS filing_date DATE,
ADD COLUMN IF NOT EXISTS accepted_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN financial_data_quarterly.net_interest_income IS 'Net interest income (Interest Income - Interest Expense)';
COMMENT ON COLUMN financial_data_quarterly.non_operating_income_excluding_interest IS 'Non-operating income excluding interest';
COMMENT ON COLUMN financial_data_quarterly.net_income_from_continuing_operations IS 'Net income from continuing operations';
COMMENT ON COLUMN financial_data_quarterly.net_income_from_discontinued_operations IS 'Net income from discontinued operations';
COMMENT ON COLUMN financial_data_quarterly.other_adjustments_to_net_income IS 'Other adjustments to net income (used for corrected EPS calculation)';
COMMENT ON COLUMN financial_data_quarterly.net_income_deductions IS 'Net income deductions';
COMMENT ON COLUMN financial_data_quarterly.bottom_line_net_income IS 'Bottom line net income';
COMMENT ON COLUMN financial_data_quarterly.gross_profit IS 'Gross profit (Revenue - Cost of Revenue)';
COMMENT ON COLUMN financial_data_quarterly.cost_of_revenue IS 'Cost of revenue';
COMMENT ON COLUMN financial_data_quarterly.research_and_development_expenses IS 'Research and development expenses';
COMMENT ON COLUMN financial_data_quarterly.general_and_administrative_expenses IS 'General and administrative expenses';
COMMENT ON COLUMN financial_data_quarterly.selling_and_marketing_expenses IS 'Selling and marketing expenses';
COMMENT ON COLUMN financial_data_quarterly.selling_general_and_administrative_expenses IS 'Selling, general and administrative expenses';
COMMENT ON COLUMN financial_data_quarterly.other_expenses IS 'Other expenses';
COMMENT ON COLUMN financial_data_quarterly.operating_expenses IS 'Operating expenses';
COMMENT ON COLUMN financial_data_quarterly.cost_and_expenses IS 'Total cost and expenses';
COMMENT ON COLUMN financial_data_quarterly.interest_income IS 'Interest income';
COMMENT ON COLUMN financial_data_quarterly.fiscal_year IS 'Fiscal year';
COMMENT ON COLUMN financial_data_quarterly.filing_date IS 'SEC filing date';
COMMENT ON COLUMN financial_data_quarterly.accepted_date IS 'SEC accepted date';

-- Add missing Balance Sheet fields
ALTER TABLE financial_data_quarterly
ADD COLUMN IF NOT EXISTS total_stockholders_equity NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS retained_earnings NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS accumulated_other_comprehensive_income_loss NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_total_stockholders_equity NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS total_liabilities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS total_non_current_liabilities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_current_liabilities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_non_current_liabilities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS total_non_current_assets NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS property_plant_equipment_net NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS goodwill NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS intangible_assets NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS long_term_investments NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS tax_assets NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_non_current_assets NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_current_assets NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS inventory NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS accounts_receivable NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS accounts_payable NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS short_term_investments NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS deferred_revenue NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS deferred_revenue_non_current NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS deferred_tax_liabilities_non_current NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_liabilities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS capital_lease_obligations NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_debt NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS common_stock NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS preferred_stock NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS treasury_stock NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS minority_interest NUMERIC(20,4);

COMMENT ON COLUMN financial_data_quarterly.total_stockholders_equity IS 'Total stockholders equity';
COMMENT ON COLUMN financial_data_quarterly.retained_earnings IS 'Retained earnings';
COMMENT ON COLUMN financial_data_quarterly.accumulated_other_comprehensive_income_loss IS 'Accumulated other comprehensive income/loss';
COMMENT ON COLUMN financial_data_quarterly.total_liabilities IS 'Total liabilities';
COMMENT ON COLUMN financial_data_quarterly.total_non_current_liabilities IS 'Total non-current liabilities';
COMMENT ON COLUMN financial_data_quarterly.total_non_current_assets IS 'Total non-current assets';
COMMENT ON COLUMN financial_data_quarterly.property_plant_equipment_net IS 'Property, plant and equipment, net';
COMMENT ON COLUMN financial_data_quarterly.goodwill IS 'Goodwill';
COMMENT ON COLUMN financial_data_quarterly.intangible_assets IS 'Intangible assets';
COMMENT ON COLUMN financial_data_quarterly.inventory IS 'Inventory';
COMMENT ON COLUMN financial_data_quarterly.accounts_receivable IS 'Accounts receivable';
COMMENT ON COLUMN financial_data_quarterly.accounts_payable IS 'Accounts payable';
COMMENT ON COLUMN financial_data_quarterly.net_debt IS 'Net debt (Total Debt - Cash and Equivalents)';

-- Add missing Cash Flow Statement fields
ALTER TABLE financial_data_quarterly
ADD COLUMN IF NOT EXISTS net_cash_provided_by_operating_activities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_cash_used_for_investing_activities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_cash_used_provided_by_financing_activities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_change_in_cash NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS stock_based_compensation NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS deferred_income_tax NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS change_in_working_capital NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS accounts_receivables_change NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS inventory_change NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS accounts_payables_change NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_working_capital_change NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_non_cash_items NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS investments_in_property_plant_and_equipment NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS acquisitions_net NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS purchases_of_investments NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS sales_maturities_of_investments NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_investing_activities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS debt_repayment NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS proceeds_from_issuance_of_debt NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS proceeds_from_issuance_of_common_stock NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS proceeds_from_repurchase_of_equity NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_financing_activities NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS effect_of_forex_changes_on_cash NUMERIC(20,4);

COMMENT ON COLUMN financial_data_quarterly.net_cash_provided_by_operating_activities IS 'Net cash provided by operating activities';
COMMENT ON COLUMN financial_data_quarterly.net_cash_used_for_investing_activities IS 'Net cash used for investing activities';
COMMENT ON COLUMN financial_data_quarterly.net_cash_used_provided_by_financing_activities IS 'Net cash provided/used by financing activities';
COMMENT ON COLUMN financial_data_quarterly.net_change_in_cash IS 'Net change in cash';
COMMENT ON COLUMN financial_data_quarterly.stock_based_compensation IS 'Stock-based compensation';
COMMENT ON COLUMN financial_data_quarterly.change_in_working_capital IS 'Change in working capital';

-- Add additional Key Metrics fields
ALTER TABLE financial_data_quarterly
ADD COLUMN IF NOT EXISTS revenue_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS net_income_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS operating_cash_flow_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS free_cash_flow_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS cash_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS tangible_book_value_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS shareholders_equity_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS interest_debt_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS capex_per_share NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS capex_to_operating_cash_flow NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS capex_to_revenue NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS capex_to_depreciation NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS stock_based_compensation_to_revenue NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS graham_number NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS graham_net_net NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS working_capital NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS tangible_asset_value NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS net_current_asset_value NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS invested_capital_metric NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS average_receivables NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS average_payables NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS average_inventory NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS capex_to_operating_income NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS earnings_yield NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS fcf_yield NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS debt_to_market_cap NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS payables_period NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS receivables_period NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS sales_general_and_administrative_to_revenue NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS research_and_development_to_revenue NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS intangibles_to_total_assets NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS dividend_paid_and_capex_coverage_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_fair_value NUMERIC(12,4);

COMMENT ON COLUMN financial_data_quarterly.revenue_per_share IS 'Revenue per share';
COMMENT ON COLUMN financial_data_quarterly.net_income_per_share IS 'Net income per share';
COMMENT ON COLUMN financial_data_quarterly.operating_cash_flow_per_share IS 'Operating cash flow per share';
COMMENT ON COLUMN financial_data_quarterly.free_cash_flow_per_share IS 'Free cash flow per share';
COMMENT ON COLUMN financial_data_quarterly.graham_number IS 'Graham Number valuation';
COMMENT ON COLUMN financial_data_quarterly.working_capital IS 'Working capital (Current Assets - Current Liabilities)';

-- Add additional Ratios fields
ALTER TABLE financial_data_quarterly
ADD COLUMN IF NOT EXISTS long_term_debt_to_capitalization NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS total_debt_to_capitalization NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS cash_flow_to_debt_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS company_equity_multiplier NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_to_free_cash_flows_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_to_operating_cash_flows_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS cash_per_share_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS operating_cash_flow_sales_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS free_cash_flow_operating_cash_flow_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS short_term_coverage_ratios NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS capital_expenditure_coverage_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS dividend_payments_coverage_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_book_value_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_to_book_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_to_sales_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_earnings_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_to_sales_ratio_ttm NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_earnings_to_growth_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS price_sales_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS dividend_per_share_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS effective_tax_rate NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS free_cash_flow_per_share_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS net_profit_margin_ratio NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS pretax_profit_margin NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS ebitda_margin NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS ebit_per_revenue NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS operating_cycle NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS days_of_inventory_outstanding_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS days_of_payables_outstanding_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS days_of_sales_outstanding_ratio NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS fixed_asset_turnover NUMERIC(12,6),
ADD COLUMN IF NOT EXISTS total_asset_turnover NUMERIC(12,6);

COMMENT ON COLUMN financial_data_quarterly.long_term_debt_to_capitalization IS 'Long-term debt to capitalization ratio';
COMMENT ON COLUMN financial_data_quarterly.cash_flow_to_debt_ratio IS 'Cash flow to debt ratio';
COMMENT ON COLUMN financial_data_quarterly.operating_cash_flow_sales_ratio IS 'Operating cash flow to sales ratio';
COMMENT ON COLUMN financial_data_quarterly.effective_tax_rate IS 'Effective tax rate';
COMMENT ON COLUMN financial_data_quarterly.pretax_profit_margin IS 'Pretax profit margin';

-- Update existing data with new fields from raw data where available
UPDATE financial_data_quarterly
SET 
  other_adjustments_to_net_income = (raw_data_income->>'otherAdjustmentsToNetIncome')::NUMERIC,
  net_income_from_continuing_operations = (raw_data_income->>'netIncomeFromContinuingOperations')::NUMERIC,
  gross_profit = (raw_data_income->>'grossProfit')::NUMERIC,
  cost_of_revenue = (raw_data_income->>'costOfRevenue')::NUMERIC,
  operating_expenses = (raw_data_income->>'operatingExpenses')::NUMERIC,
  selling_general_and_administrative_expenses = (raw_data_income->>'sellingGeneralAndAdministrativeExpenses')::NUMERIC,
  research_and_development_expenses = (raw_data_income->>'researchAndDevelopmentExpenses')::NUMERIC,
  interest_income = (raw_data_income->>'interestIncome')::NUMERIC,
  net_interest_income = (raw_data_income->>'netInterestIncome')::NUMERIC,
  filing_date = (raw_data_income->>'filingDate')::DATE,
  fiscal_year = raw_data_income->>'fiscalYear',
  accepted_date = (raw_data_income->>'acceptedDate')::TIMESTAMP
WHERE raw_data_income IS NOT NULL;