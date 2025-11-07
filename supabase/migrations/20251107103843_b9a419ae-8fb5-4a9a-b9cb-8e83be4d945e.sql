-- Create table for risk-free rates (10-year government bonds)
CREATE TABLE IF NOT EXISTS public.risk_free_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  valid_date DATE NOT NULL,
  data_source TEXT NOT NULL, -- 'FMP' or 'FRED'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_country_date UNIQUE (country_code, valid_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_risk_free_rates_country_date ON public.risk_free_rates(country_code, valid_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_free_rates_valid_date ON public.risk_free_rates(valid_date DESC);

-- Enable RLS
ALTER TABLE public.risk_free_rates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read risk-free rates
CREATE POLICY "Anyone can read risk-free rates"
  ON public.risk_free_rates
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert
CREATE POLICY "Service role can insert risk-free rates"
  ON public.risk_free_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "Service role can update risk-free rates"
  ON public.risk_free_rates
  FOR UPDATE
  TO service_role
  USING (true);

-- Allow service role to delete
CREATE POLICY "Service role can delete risk-free rates"
  ON public.risk_free_rates
  FOR DELETE
  TO service_role
  USING (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_risk_free_rates_updated_at
  BEFORE UPDATE ON public.risk_free_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();