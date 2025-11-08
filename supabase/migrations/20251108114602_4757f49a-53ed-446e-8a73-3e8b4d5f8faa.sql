-- Add symbol and name columns to financial_statements table
ALTER TABLE public.financial_statements 
ADD COLUMN IF NOT EXISTS symbol TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_financial_statements_symbol ON public.financial_statements(symbol);
CREATE INDEX IF NOT EXISTS idx_financial_statements_name ON public.financial_statements(name);