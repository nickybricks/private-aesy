-- Fix stocks table id column to auto-generate
-- First, create a sequence if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'stocks_id_seq') THEN
    CREATE SEQUENCE public.stocks_id_seq;
  END IF;
END $$;

-- Set the id column to use the sequence as default
ALTER TABLE public.stocks 
ALTER COLUMN id SET DEFAULT nextval('public.stocks_id_seq'::regclass);

-- Set the sequence ownership to the column
ALTER SEQUENCE public.stocks_id_seq OWNED BY public.stocks.id;

-- Update the sequence to start from the current max id + 1
SELECT setval('public.stocks_id_seq', COALESCE((SELECT MAX(id) FROM public.stocks), 0) + 1, false);