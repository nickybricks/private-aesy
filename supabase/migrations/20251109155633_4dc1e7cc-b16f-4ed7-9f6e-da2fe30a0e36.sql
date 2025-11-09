-- Add price_change_1d column to precomputed_metrics table
ALTER TABLE public.precomputed_metrics
ADD COLUMN IF NOT EXISTS price_change_1d numeric;