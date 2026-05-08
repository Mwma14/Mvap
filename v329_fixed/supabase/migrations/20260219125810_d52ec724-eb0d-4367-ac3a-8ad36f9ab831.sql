-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE movies;
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE tv_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE football_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE info_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE pricing_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;

-- Insert app_version setting if not exists
INSERT INTO site_settings (key, value)
VALUES ('app_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;