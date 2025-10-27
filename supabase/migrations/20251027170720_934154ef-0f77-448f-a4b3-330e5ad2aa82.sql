-- Add new columns for corrected EPS and P/E calculations
ALTER TABLE financial_data_quarterly 
ADD COLUMN IF NOT EXISTS net_income_before_adjustments NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS other_adjustments_to_net_income NUMERIC(20,4),
ADD COLUMN IF NOT EXISTS eps_corrected NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS pe_ratio_corrected NUMERIC(12,4);

COMMENT ON COLUMN financial_data_quarterly.net_income_before_adjustments IS 'Net Income minus Other Adjustments to Net Income (operative result)';
COMMENT ON COLUMN financial_data_quarterly.other_adjustments_to_net_income IS 'Value of totalOtherIncomeExpensesNet from FMP';
COMMENT ON COLUMN financial_data_quarterly.eps_corrected IS 'Corrected EPS = net_income_before_adjustments / weighted_avg_shares_diluted';
COMMENT ON COLUMN financial_data_quarterly.pe_ratio_corrected IS 'Corrected P/E Ratio = stock_price / eps_corrected';

-- Optional: Update existing data with corrected calculations
UPDATE financial_data_quarterly
SET 
  other_adjustments_to_net_income = COALESCE((raw_data_income->>'totalOtherIncomeExpensesNet')::NUMERIC, 0),
  net_income_before_adjustments = net_income - COALESCE((raw_data_income->>'totalOtherIncomeExpensesNet')::NUMERIC, 0),
  eps_corrected = CASE 
    WHEN weighted_avg_shares_diluted > 0 
    THEN (net_income - COALESCE((raw_data_income->>'totalOtherIncomeExpensesNet')::NUMERIC, 0)) / weighted_avg_shares_diluted
    ELSE NULL
  END,
  pe_ratio_corrected = CASE 
    WHEN weighted_avg_shares_diluted > 0 AND stock_price_close IS NOT NULL AND stock_price_close > 0
    THEN stock_price_close / (
      (net_income - COALESCE((raw_data_income->>'totalOtherIncomeExpensesNet')::NUMERIC, 0)) / weighted_avg_shares_diluted
    )
    ELSE NULL
  END
WHERE raw_data_income IS NOT NULL
  AND weighted_avg_shares_diluted > 0;