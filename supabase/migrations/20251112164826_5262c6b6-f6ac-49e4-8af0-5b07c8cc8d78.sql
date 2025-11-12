-- Add new price columns and missing TTM columns to precomputed_metrics
ALTER TABLE precomputed_metrics
ADD COLUMN IF NOT EXISTS current_price_usd numeric,
ADD COLUMN IF NOT EXISTS current_price_eur numeric,
ADD COLUMN IF NOT EXISTS price_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS weighted_avg_shares_dil numeric,
ADD COLUMN IF NOT EXISTS revenue_usd numeric,
ADD COLUMN IF NOT EXISTS revenue_eur numeric,
ADD COLUMN IF NOT EXISTS revenue_orig numeric,
ADD COLUMN IF NOT EXISTS fcf_per_share numeric,
ADD COLUMN IF NOT EXISTS operating_cash_flow_per_share numeric;

-- Drop existing ratio columns (they will become generated columns)
ALTER TABLE precomputed_metrics
DROP COLUMN IF EXISTS pe_ratio CASCADE,
DROP COLUMN IF EXISTS ps_ratio CASCADE,
DROP COLUMN IF EXISTS pb_ratio CASCADE,
DROP COLUMN IF EXISTS p_fcf_ratio CASCADE,
DROP COLUMN IF EXISTS p_ocf_ratio CASCADE;

-- Create generated columns for valuation ratios
-- PE Ratio = current_price_usd / eps_diluted_usd
ALTER TABLE precomputed_metrics
ADD COLUMN pe_ratio numeric GENERATED ALWAYS AS (
  CASE 
    WHEN eps_diluted_usd > 0 THEN current_price_usd / eps_diluted_usd
    ELSE NULL
  END
) STORED;

-- PS Ratio = (current_price_usd * shares_outstanding) / revenue_usd
ALTER TABLE precomputed_metrics
ADD COLUMN ps_ratio numeric GENERATED ALWAYS AS (
  CASE 
    WHEN revenue_usd > 0 AND weighted_avg_shares_dil > 0 
    THEN (current_price_usd * weighted_avg_shares_dil) / revenue_usd
    ELSE NULL
  END
) STORED;

-- PB Ratio = current_price_usd / book_value_per_share
ALTER TABLE precomputed_metrics
ADD COLUMN pb_ratio numeric GENERATED ALWAYS AS (
  CASE 
    WHEN bvps > 0 THEN current_price_usd / bvps
    ELSE NULL
  END
) STORED;

-- P/FCF Ratio = current_price_usd / fcf_per_share
ALTER TABLE precomputed_metrics
ADD COLUMN p_fcf_ratio numeric GENERATED ALWAYS AS (
  CASE 
    WHEN fcf_per_share > 0 THEN current_price_usd / fcf_per_share
    ELSE NULL
  END
) STORED;

-- P/OCF Ratio = current_price_usd / operating_cash_flow_per_share
ALTER TABLE precomputed_metrics
ADD COLUMN p_ocf_ratio numeric GENERATED ALWAYS AS (
  CASE 
    WHEN operating_cash_flow_per_share > 0 
    THEN current_price_usd / operating_cash_flow_per_share
    ELSE NULL
  END
) STORED;

-- Create index on price_updated_at for monitoring
CREATE INDEX IF NOT EXISTS idx_precomputed_metrics_price_updated 
ON precomputed_metrics(price_updated_at);

COMMENT ON COLUMN precomputed_metrics.current_price_usd IS 'Live price in USD, updated every 10 minutes by update-prices function';
COMMENT ON COLUMN precomputed_metrics.current_price_eur IS 'Live price in EUR, updated every 10 minutes by update-prices function';
COMMENT ON COLUMN precomputed_metrics.price_updated_at IS 'Timestamp of last price update';
COMMENT ON COLUMN precomputed_metrics.weighted_avg_shares_dil IS 'Weighted average diluted shares outstanding (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.revenue_usd IS 'Revenue in USD (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.revenue_eur IS 'Revenue in EUR (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.revenue_orig IS 'Revenue in original currency (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.fcf_per_share IS 'Free cash flow per share (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.operating_cash_flow_per_share IS 'Operating cash flow per share (TTM), updated quarterly';
COMMENT ON COLUMN precomputed_metrics.pe_ratio IS 'Generated: current_price_usd / eps_diluted_usd';
COMMENT ON COLUMN precomputed_metrics.ps_ratio IS 'Generated: (current_price_usd * weighted_avg_shares_dil) / revenue_usd';
COMMENT ON COLUMN precomputed_metrics.pb_ratio IS 'Generated: current_price_usd / bvps';
COMMENT ON COLUMN precomputed_metrics.p_fcf_ratio IS 'Generated: current_price_usd / fcf_per_share';
COMMENT ON COLUMN precomputed_metrics.p_ocf_ratio IS 'Generated: current_price_usd / operating_cash_flow_per_share';