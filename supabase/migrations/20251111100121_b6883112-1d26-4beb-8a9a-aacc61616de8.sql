-- Remove duplicate entries in precomputed_metrics, keeping only the most recent for each stock_id
DELETE FROM precomputed_metrics
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY updated_at DESC, created_at DESC) as rn
    FROM precomputed_metrics
  ) t
  WHERE rn > 1
);

-- Add unique constraint on stock_id
ALTER TABLE precomputed_metrics 
ADD CONSTRAINT precomputed_metrics_stock_id_unique UNIQUE (stock_id);

COMMENT ON CONSTRAINT precomputed_metrics_stock_id_unique ON precomputed_metrics 
IS 'Ensures each stock has only one row. New calculations replace old data.';