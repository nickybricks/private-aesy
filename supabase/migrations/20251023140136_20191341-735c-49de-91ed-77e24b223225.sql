-- Create exchange_rates table for caching currency conversion rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'USD',
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  is_fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched_at ON public.exchange_rates(fetched_at);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can read exchange rates)
CREATE POLICY "Exchange rates are viewable by everyone"
  ON public.exchange_rates
  FOR SELECT
  USING (true);

-- Service role can manage exchange rates
CREATE POLICY "Service role can insert exchange rates"
  ON public.exchange_rates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update exchange rates"
  ON public.exchange_rates
  FOR UPDATE
  USING (true);

-- Insert fallback exchange rates (180 currencies with base USD)
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, is_fallback, fetched_at)
VALUES
  ('USD', 'ADA', 1.5591723638, true, now()),
  ('USD', 'AED', 3.6734007017, true, now()),
  ('USD', 'AFN', 66.3656072689, true, now()),
  ('USD', 'ALL', 83.4000137438, true, now()),
  ('USD', 'AMD', 382.5400683857, true, now()),
  ('USD', 'ANG', 1.7880003117, true, now()),
  ('USD', 'AOA', 911.9781297111, true, now()),
  ('USD', 'ARB', 3.2187039746, true, now()),
  ('USD', 'ARS', 1483.0101891487, true, now()),
  ('USD', 'AUD', 1.5359002715, true, now()),
  ('USD', 'AWG', 1.79, true, now()),
  ('USD', 'AZN', 1.7, true, now()),
  ('USD', 'BAM', 1.6851002502, true, now()),
  ('USD', 'BBD', 2, true, now()),
  ('USD', 'BDT', 122.1120187045, true, now()),
  ('USD', 'BGN', 1.685200283, true, now()),
  ('USD', 'BHD', 0.376, true, now()),
  ('USD', 'BIF', 2948.4004616716, true, now()),
  ('USD', 'BMD', 1, true, now()),
  ('USD', 'BNB', 0.0009141109, true, now()),
  ('USD', 'BND', 1.2990002125, true, now()),
  ('USD', 'BOB', 6.9400009347, true, now()),
  ('USD', 'BRL', 5.3814009612, true, now()),
  ('USD', 'BSD', 1, true, now()),
  ('USD', 'BTC', 0.0000091322, true, now()),
  ('USD', 'BTN', 87.8189880361, true, now()),
  ('USD', 'BWP', 13.3511019807, true, now()),
  ('USD', 'BYN', 3.4056168339, true, now()),
  ('USD', 'BYR', 34056.16876024, true, now()),
  ('USD', 'BZD', 2, true, now()),
  ('USD', 'CAD', 1.3987102686, true, now()),
  ('USD', 'CDF', 2198.3504303083, true, now()),
  ('USD', 'CHF', 0.7966200806, true, now()),
  ('USD', 'CLF', 0.0240300027, true, now()),
  ('USD', 'CLP', 946.0501222856, true, now()),
  ('USD', 'CNY', 7.1230009159, true, now()),
  ('USD', 'COP', 3882.5405043686, true, now()),
  ('USD', 'CRC', 502.651332874, true, now()),
  ('USD', 'CUC', 1, true, now()),
  ('USD', 'CUP', 24, true, now()),
  ('USD', 'CVE', 95.1400152472, true, now()),
  ('USD', 'CZK', 20.9603024951, true, now()),
  ('USD', 'DAI', 0.9999297903, true, now()),
  ('USD', 'DJF', 177.721, true, now()),
  ('USD', 'DKK', 6.4355907566, true, now()),
  ('USD', 'DOP', 63.7600109942, true, now()),
  ('USD', 'DOT', 0.3357133999, true, now()),
  ('USD', 'DZD', 130.8180144781, true, now()),
  ('USD', 'EGP', 47.5633083558, true, now()),
  ('USD', 'ERN', 15, true, now()),
  ('USD', 'ETB', 150.1320245432, true, now()),
  ('USD', 'ETH', 0.0002595238, true, now()),
  ('USD', 'EUR', 0.8616001526, true, now()),
  ('USD', 'FJD', 2.2988004376, true, now()),
  ('USD', 'FKP', 0.7500903969, true, now()),
  ('USD', 'GBP', 0.7499600767, true, now()),
  ('USD', 'GEL', 2.7105003892, true, now()),
  ('USD', 'GGP', 0.7500904172, true, now()),
  ('USD', 'GHS', 10.7771315218, true, now()),
  ('USD', 'GIP', 0.7500903511, true, now()),
  ('USD', 'GMD', 73.0000122721, true, now()),
  ('USD', 'GNF', 8708.0015212777, true, now()),
  ('USD', 'GTQ', 7.6560009322, true, now()),
  ('USD', 'GYD', 208.8900219032, true, now()),
  ('USD', 'HKD', 7.7711015064, true, now()),
  ('USD', 'HNL', 26.1571042702, true, now()),
  ('USD', 'HRK', 6.4923694239, true, now()),
  ('USD', 'HTG', 130.8900198297, true, now()),
  ('USD', 'HUF', 336.0200537739, true, now()),
  ('USD', 'IDR', 16622.701930926, true, now()),
  ('USD', 'ILS', 3.2929305355, true, now()),
  ('USD', 'IMP', 0.7500903831, true, now()),
  ('USD', 'INR', 87.8302147023, true, now()),
  ('USD', 'IQD', 1310.5002006959, true, now()),
  ('USD', 'IRR', 42003.006335408, true, now()),
  ('USD', 'ISK', 122.5200174335, true, now()),
  ('USD', 'JEP', 0.7500903847, true, now()),
  ('USD', 'JMD', 159.9400285822, true, now()),
  ('USD', 'JOD', 0.71, true, now()),
  ('USD', 'JPY', 152.698016582, true, now()),
  ('USD', 'KES', 129.1908175328, true, now()),
  ('USD', 'KGS', 87.4500155416, true, now()),
  ('USD', 'KHR', 4023.0008034389, true, now()),
  ('USD', 'KMF', 424.4500679014, true, now()),
  ('USD', 'KPW', 899.9703594614, true, now()),
  ('USD', 'KRW', 1435.5972373197, true, now()),
  ('USD', 'KWD', 0.3068000506, true, now()),
  ('USD', 'KYD', 0.83333, true, now()),
  ('USD', 'KZT', 537.4400692445, true, now()),
  ('USD', 'LAK', 21614.002365585, true, now()),
  ('USD', 'LBP', 89500.010572602, true, now()),
  ('USD', 'LKR', 303.5500519695, true, now()),
  ('USD', 'LRD', 183.3400332417, true, now()),
  ('USD', 'LSL', 17.3722023949, true, now()),
  ('USD', 'LTC', 0.0106863258, true, now()),
  ('USD', 'LTL', 2.9752277425, true, now()),
  ('USD', 'LVL', 0.6055926135, true, now()),
  ('USD', 'LYD', 5.4392008876, true, now()),
  ('USD', 'MAD', 9.2253015501, true, now()),
  ('USD', 'MDL', 16.9300025108, true, now()),
  ('USD', 'MGA', 4515.0006374521, true, now()),
  ('USD', 'MKD', 53.1534073497, true, now()),
  ('USD', 'MMK', 2098.6803814383, true, now()),
  ('USD', 'MNT', 3595.2954014291, true, now()),
  ('USD', 'MOP', 8.0044015646, true, now()),
  ('USD', 'MRO', 356.999828, true, now()),
  ('USD', 'MUR', 45.5195056371, true, now()),
  ('USD', 'MVR', 15.4600019703, true, now()),
  ('USD', 'MWK', 1733.673342707, true, now()),
  ('USD', 'MXN', 18.3985023849, true, now()),
  ('USD', 'MYR', 4.2263006907, true, now()),
  ('USD', 'MZN', 63.5600110242, true, now()),
  ('USD', 'NAD', 17.3151019791, true, now()),
  ('USD', 'NGN', 1461.5352282708, true, now()),
  ('USD', 'NIO', 36.775456846, true, now()),
  ('USD', 'NOK', 9.9884212263, true, now()),
  ('USD', 'NPR', 140.5530159698, true, now()),
  ('USD', 'NZD', 1.7399002445, true, now()),
  ('USD', 'OMR', 0.3851000483, true, now()),
  ('USD', 'OP', 2.3176033141, true, now()),
  ('USD', 'PAB', 1.0000001414, true, now()),
  ('USD', 'PEN', 3.4083006455, true, now()),
  ('USD', 'PGK', 4.1806005107, true, now()),
  ('USD', 'PHP', 58.6145080862, true, now()),
  ('USD', 'PKR', 280.8800314579, true, now()),
  ('USD', 'PLN', 3.6464005512, true, now()),
  ('USD', 'PYG', 7073.0008241682, true, now()),
  ('USD', 'QAR', 3.6410004886, true, now()),
  ('USD', 'RON', 4.3800007776, true, now()),
  ('USD', 'RSD', 100.9930171848, true, now()),
  ('USD', 'RUB', 81.2700156826, true, now()),
  ('USD', 'RWF', 1452.8502148318, true, now()),
  ('USD', 'SAR', 3.7505005526, true, now()),
  ('USD', 'SBD', 8.4970760598, true, now()),
  ('USD', 'SCR', 14.9087025278, true, now()),
  ('USD', 'SDG', 601.5, true, now()),
  ('USD', 'SEK', 9.3985014391, true, now()),
  ('USD', 'SGD', 1.2990101973, true, now()),
  ('USD', 'SHP', 0.7493000939, true, now()),
  ('USD', 'SLL', 22617.604326163, true, now()),
  ('USD', 'SOL', 0.0052319536, true, now()),
  ('USD', 'SOS', 569.9000991353, true, now()),
  ('USD', 'SRD', 39.6570068718, true, now()),
  ('USD', 'STD', 21257.681573016, true, now()),
  ('USD', 'SVC', 8.75, true, now()),
  ('USD', 'SYP', 11057.239193384, true, now()),
  ('USD', 'SZL', 17.3055033469, true, now()),
  ('USD', 'THB', 32.7300065278, true, now()),
  ('USD', 'TJS', 9.2271015452, true, now()),
  ('USD', 'TMT', 3.5, true, now()),
  ('USD', 'TND', 2.9300003366, true, now()),
  ('USD', 'TOP', 2.3935004256, true, now()),
  ('USD', 'TRY', 41.9845074439, true, now()),
  ('USD', 'TTD', 6.7174007584, true, now()),
  ('USD', 'TWD', 30.8550045643, true, now()),
  ('USD', 'TZS', 2443.0003045148, true, now()),
  ('USD', 'UAH', 41.8970077304, true, now()),
  ('USD', 'UGX', 3489.1005082239, true, now()),
  ('USD', 'USD', 1, true, now()),
  ('USD', 'UYU', 39.9150057439, true, now()),
  ('USD', 'UZS', 12129.331229895, true, now()),
  ('USD', 'VEF', 20994894.477172, true, now()),
  ('USD', 'VND', 26222.00483503, true, now()),
  ('USD', 'VUV', 121.8430087605, true, now()),
  ('USD', 'WST', 2.8065296164, true, now()),
  ('USD', 'XAF', 565.1601099113, true, now()),
  ('USD', 'XAG', 0.0202661997, true, now()),
  ('USD', 'XAU', 0.0002411711, true, now()),
  ('USD', 'XCD', 2.7, true, now()),
  ('USD', 'XDR', 0.7345201228, true, now()),
  ('USD', 'XOF', 565.1600730357, true, now()),
  ('USD', 'XPD', 0.000679486, true, now()),
  ('USD', 'XPF', 103.0500200281, true, now()),
  ('USD', 'XPT', 0.0006075861, true, now()),
  ('USD', 'XRP', 0.4165095266, true, now()),
  ('USD', 'YER', 238.8300275162, true, now()),
  ('USD', 'ZAR', 17.3166026487, true, now()),
  ('USD', 'ZMK', 9001.2, true, now()),
  ('USD', 'ZMW', 22.1500024374, true, now()),
  ('USD', 'ZWL', 66565.509390684, true, now())
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily exchange rate update at 2:00 AM UTC
SELECT cron.schedule(
  'daily-exchange-rates-update',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://slpruxtkowlxawssqyup.supabase.co/functions/v1/fetch-exchange-rates',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscHJ1eHRrb3dseGF3c3NxeXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwOTAsImV4cCI6MjA3MjAzNDA5MH0.mjB-ucA3FcQuwKiG1zs-6voNrvYHjpblKOSPijleHUQ"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);