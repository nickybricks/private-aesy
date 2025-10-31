-- Add valid_date column for historical exchange rates
ALTER TABLE exchange_rates 
ADD COLUMN IF NOT EXISTS valid_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Drop old unique constraint if it exists (base_currency, target_currency only)
ALTER TABLE exchange_rates 
DROP CONSTRAINT IF EXISTS exchange_rates_base_currency_target_currency_key;

-- Add new unique constraint including valid_date
ALTER TABLE exchange_rates 
ADD CONSTRAINT exchange_rates_base_target_date_unique 
UNIQUE (base_currency, target_currency, valid_date);

-- Create index for efficient lookups (most recent date first)
CREATE INDEX IF NOT EXISTS idx_rate_lookup 
ON exchange_rates (base_currency, target_currency, valid_date DESC);

-- Create index on valid_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_rate_valid_date 
ON exchange_rates (valid_date DESC);