-- Add research_and_development_expenses and total_other_income_expenses_net columns to financial_statements table
-- (Note: income_tax_expense and income_before_tax already exist in the table)
ALTER TABLE financial_statements
ADD COLUMN IF NOT EXISTS research_and_development_expenses_orig numeric,
ADD COLUMN IF NOT EXISTS research_and_development_expenses_usd numeric,
ADD COLUMN IF NOT EXISTS research_and_development_expenses_eur numeric,
ADD COLUMN IF NOT EXISTS total_other_income_expenses_net_orig numeric,
ADD COLUMN IF NOT EXISTS total_other_income_expenses_net_usd numeric,
ADD COLUMN IF NOT EXISTS total_other_income_expenses_net_eur numeric;