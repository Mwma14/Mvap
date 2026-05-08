-- Create site_settings table for admin-configurable values
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete settings
CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values
INSERT INTO public.site_settings (key, value) VALUES
('admin_contacts', '{
    "telegram": {"handle": "@onedove", "url": "https://t.me/onedove"},
    "viber": {"number": "09883249943", "url": "viber://chat?number=09883249943"},
    "email": {"address": "thewaymmofficial@gmail.com", "url": "mailto:thewaymmofficial@gmail.com?subject=Premium%20Subscription%20Inquiry"}
}'::jsonb),
('subscription_prices', '{
    "monthly": {"mmk": 2000, "usd": 0.5, "label": "1 Month"},
    "yearly": {"mmk": 20000, "usd": 5, "label": "1 Year"},
    "lifetime": {"mmk": 40000, "usd": 10, "label": "Lifetime"}
}'::jsonb);