-- Phase 1: Datenbank-Schema für Stock Data Cache

-- Tabelle für gecachte Stock-Rohdaten
CREATE TABLE IF NOT EXISTS public.stock_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  company_name TEXT,
  exchange TEXT,
  sector TEXT,
  currency TEXT,
  raw_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique Index für schnelle Symbol-Lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_data_cache_symbol ON public.stock_data_cache(symbol);

-- Index für Exchange-Filterung
CREATE INDEX IF NOT EXISTS idx_stock_data_cache_exchange ON public.stock_data_cache(exchange);

-- Index für Sektor-Filterung
CREATE INDEX IF NOT EXISTS idx_stock_data_cache_sector ON public.stock_data_cache(sector);

-- Index für Datum-basierte Queries
CREATE INDEX IF NOT EXISTS idx_stock_data_cache_last_updated ON public.stock_data_cache(last_updated);

-- Tabelle für gecachte Analyse-Ergebnisse
CREATE TABLE IF NOT EXISTS public.stock_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  market_id TEXT NOT NULL,
  buffett_score NUMERIC,
  analysis_result JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_symbol_market UNIQUE (symbol, market_id)
);

-- Index für schnelle Symbol-Lookups
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_symbol ON public.stock_analysis_cache(symbol);

-- Index für Market-ID-Filterung
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_market_id ON public.stock_analysis_cache(market_id);

-- Index für Score-basierte Sortierung
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_score ON public.stock_analysis_cache(buffett_score DESC NULLS LAST);

-- Index für Datum-basierte Queries
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_last_updated ON public.stock_analysis_cache(last_updated);

-- Kombinierter Index für häufige Queries
CREATE INDEX IF NOT EXISTS idx_stock_analysis_cache_market_score ON public.stock_analysis_cache(market_id, buffett_score DESC NULLS LAST);

-- Enable RLS
ALTER TABLE public.stock_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies für stock_data_cache (öffentlich lesbar, nur System kann schreiben)
CREATE POLICY "Anyone can read stock data cache"
  ON public.stock_data_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert stock data cache"
  ON public.stock_data_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update stock data cache"
  ON public.stock_data_cache
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete stock data cache"
  ON public.stock_data_cache
  FOR DELETE
  USING (true);

-- RLS Policies für stock_analysis_cache (öffentlich lesbar, nur System kann schreiben)
CREATE POLICY "Anyone can read stock analysis cache"
  ON public.stock_analysis_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert stock analysis cache"
  ON public.stock_analysis_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update stock analysis cache"
  ON public.stock_analysis_cache
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete stock analysis cache"
  ON public.stock_analysis_cache
  FOR DELETE
  USING (true);

-- Trigger für automatische updated_at Aktualisierung
CREATE TRIGGER update_stock_data_cache_updated_at
  BEFORE UPDATE ON public.stock_data_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_analysis_cache_updated_at
  BEFORE UPDATE ON public.stock_analysis_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();