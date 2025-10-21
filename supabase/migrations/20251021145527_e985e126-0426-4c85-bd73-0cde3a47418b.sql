-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily price updates at 22:00 UTC (after US/European market close)
SELECT cron.schedule(
  'daily-stock-price-update',
  '0 22 * * *', -- Every day at 22:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://slpruxtkowlxawssqyup.supabase.co/functions/v1/daily-price-update',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscHJ1eHRrb3dseGF3c3NxeXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwOTAsImV4cCI6MjA3MjAzNDA5MH0.mjB-ucA3FcQuwKiG1zs-6voNrvYHjpblKOSPijleHUQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule weekly full analysis updates on Sunday at 02:00 UTC (for quarterly reports)
SELECT cron.schedule(
  'weekly-full-analysis-update',
  '0 2 * * 0', -- Every Sunday at 02:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://slpruxtkowlxawssqyup.supabase.co/functions/v1/bulk-populate-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscHJ1eHRrb3dseGF3c3NxeXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwOTAsImV4cCI6MjA3MjAzNDA5MH0.mjB-ucA3FcQuwKiG1zs-6voNrvYHjpblKOSPijleHUQ"}'::jsonb,
        body:='{"marketId": "NYSE", "limit": 999999, "scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add cron job for NASDAQ weekly update
SELECT cron.schedule(
  'weekly-nasdaq-analysis-update',
  '30 2 * * 0', -- Every Sunday at 02:30 UTC (30 minutes after NYSE)
  $$
  SELECT
    net.http_post(
        url:='https://slpruxtkowlxawssqyup.supabase.co/functions/v1/bulk-populate-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscHJ1eHRrb3dseGF3c3NxeXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwOTAsImV4cCI6MjA3MjAzNDA5MH0.mjB-ucA3FcQuwKiG1zs-6voNrvYHjpblKOSPijleHUQ"}'::jsonb,
        body:='{"marketId": "NASDAQ", "limit": 999999, "scheduled": true}'::jsonb
    ) as request_id;
  $$
);