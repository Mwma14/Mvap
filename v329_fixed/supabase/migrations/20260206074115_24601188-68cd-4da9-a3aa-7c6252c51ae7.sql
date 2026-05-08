
-- 1. Make payment-screenshots bucket public so admin can view screenshots
UPDATE storage.buckets SET public = true WHERE id = 'payment-screenshots';

-- 2. Add storage policy for public read access to payment screenshots
CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

-- 3. Update handle_new_user to save display_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NULL)
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free_user');
  RETURN NEW;
END;
$$;
