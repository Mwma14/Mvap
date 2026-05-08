-- Insert announcement setting into site_settings if it doesn't exist
INSERT INTO public.site_settings (key, value)
VALUES ('announcement', '{"enabled": false, "text": "", "bgColor": "#e50914", "textColor": "#ffffff", "speed": "normal"}')
ON CONFLICT (key) DO NOTHING;