-- Create market_risk_premiums table
CREATE TABLE IF NOT EXISTS public.market_risk_premiums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  total_equity_risk_premium NUMERIC NOT NULL,
  valid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate entries for same country and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_risk_premiums_country_date 
ON public.market_risk_premiums(country, valid_date);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_market_risk_premiums_valid_date 
ON public.market_risk_premiums(valid_date DESC);

-- Enable RLS
ALTER TABLE public.market_risk_premiums ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read
CREATE POLICY "Anyone can read market risk premiums"
ON public.market_risk_premiums
FOR SELECT
USING (true);

-- Allow service role to insert
CREATE POLICY "Service role can insert market risk premiums"
ON public.market_risk_premiums
FOR INSERT
WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "Service role can update market risk premiums"
ON public.market_risk_premiums
FOR UPDATE
USING (true);

-- Allow service role to delete
CREATE POLICY "Service role can delete market risk premiums"
ON public.market_risk_premiums
FOR DELETE
USING (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_market_risk_premiums_updated_at
BEFORE UPDATE ON public.market_risk_premiums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();