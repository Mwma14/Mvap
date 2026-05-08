
-- 1. Create user_devices table
CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text NOT NULL DEFAULT 'Unknown Device',
  device_id text NOT NULL,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view own devices"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices"
ON public.user_devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete own devices"
ON public.user_devices
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add max_devices column to user_roles
ALTER TABLE public.user_roles
ADD COLUMN max_devices integer NOT NULL DEFAULT 1;

-- 3. Update existing admin roles to unlimited
UPDATE public.user_roles
SET max_devices = 99
WHERE role = 'admin';

-- 4. Update existing premium roles based on premium_type
UPDATE public.user_roles
SET max_devices = 3
WHERE role = 'premium' AND premium_type = 'platinum';

UPDATE public.user_roles
SET max_devices = 2
WHERE role = 'premium' AND premium_type = 'gold';

UPDATE public.user_roles
SET max_devices = 2
WHERE role = 'premium' AND premium_type IS NULL;
