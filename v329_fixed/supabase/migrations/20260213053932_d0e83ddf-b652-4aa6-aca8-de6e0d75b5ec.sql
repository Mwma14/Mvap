UPDATE site_settings 
SET value = replace(value::text, '{"url":"https://raw.githubusercontent.com/tztturbo/Myanmar-TV-Channels/refs/heads/main/Myanmar%20TV%20Channels","enabled":true}', '{"url":"https://raw.githubusercontent.com/tztturbo/Myanmar-TV-Channels/refs/heads/main/Myanmar%20TV%20Channels","enabled":true,"label":"Myanmar TV"}')
WHERE key = 'live_tv_sources';