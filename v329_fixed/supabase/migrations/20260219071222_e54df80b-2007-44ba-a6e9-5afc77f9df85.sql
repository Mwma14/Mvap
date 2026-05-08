
-- Add payment_method column (may already exist from partial migration)
DO $$ BEGIN
  ALTER TABLE public.premium_requests ADD COLUMN payment_method text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add storage RLS policies for payment-screenshots bucket (INSERT and UPDATE only, SELECT already exists)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload payment screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update own payment screenshots"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
