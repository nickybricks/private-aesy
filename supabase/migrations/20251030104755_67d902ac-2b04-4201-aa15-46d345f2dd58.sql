-- Neue Spalten für Branche/Industrie-Hierarchie hinzufügen
ALTER TABLE stock_analysis_cache
ADD COLUMN IF NOT EXISTS branch_de TEXT,
ADD COLUMN IF NOT EXISTS branch_en TEXT,
ADD COLUMN IF NOT EXISTS industry_de TEXT;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_branch 
ON stock_analysis_cache(branch_en);

-- Kommentare
COMMENT ON COLUMN stock_analysis_cache.branch_de IS 'Deutsche Branchenbezeichnung (z.B. "Medien & Unterhaltung")';
COMMENT ON COLUMN stock_analysis_cache.branch_en IS 'Englische Branchenbezeichnung (z.B. "Media & Entertainment")';
COMMENT ON COLUMN stock_analysis_cache.industry_de IS 'Deutsche Industriebezeichnung (z.B. "Internetinhalte & Informationen")';