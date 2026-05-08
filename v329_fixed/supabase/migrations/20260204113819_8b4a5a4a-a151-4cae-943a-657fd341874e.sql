-- Add premium subscription tracking columns to user_roles
ALTER TABLE public.user_roles
ADD COLUMN premium_type text DEFAULT NULL,
ADD COLUMN premium_started_at timestamp with time zone DEFAULT NULL,
ADD COLUMN premium_expires_at timestamp with time zone DEFAULT NULL;

-- Add a comment explaining the premium_type values
COMMENT ON COLUMN public.user_roles.premium_type IS 'Values: monthly, yearly, lifetime, or NULL for non-premium users';

-- Create a function to check if premium has expired
CREATE OR REPLACE FUNCTION public.is_premium_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'premium'
      AND (
        premium_type = 'lifetime'
        OR premium_expires_at IS NULL
        OR premium_expires_at > now()
      )
  )
$$;