
UPDATE site_settings 
SET value = replace(
  value::text, 
  '"url":"https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/refs/heads/main/Movies/SecretWorld/Movies.txt add this channel links and make sure to work in app like other channels","enabled":true}', 
  '"url":"https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/refs/heads/main/Movies/SecretWorld/Movies.txt","enabled":true,"label":"Movies - SecretWorld"}'
)
WHERE key = 'live_tv_sources';
