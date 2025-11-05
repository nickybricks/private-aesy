-- Add price and last_dividend columns to stocks table
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS last_dividend numeric;

-- Create trigger to automatically update last_updated column
CREATE OR REPLACE FUNCTION update_stocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS stocks_updated_at_trigger ON stocks;
CREATE TRIGGER stocks_updated_at_trigger
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_stocks_updated_at();