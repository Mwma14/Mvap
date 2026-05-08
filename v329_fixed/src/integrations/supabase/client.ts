// ⚠️  TO SWITCH TO YOUR NEW SUPABASE DATABASE:
//    1. Replace SUPABASE_URL with your new project URL
//       (e.g. https://abcdefghijklmnop.supabase.co)
//    2. Replace SUPABASE_PUBLISHABLE_KEY with your new anon/public key
//    3. Update adminClient.ts with the new service_role key
//    4. Update SUPABASE_PROJECT_URL in TelegramFilesAdmin.tsx with the same URL
//    5. APP_VERSION is already bumped to v3.2.9 to force cache clear on new DB
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 🔑 SUPABASE PROJECT (UPDATED)
// NOTE:
// - It is OK to ship the anon/public key in the client.
// - NEVER ship the service_role key in a client (APK/web), because it can be extracted.
const SUPABASE_URL = "https://twwudowfdvxsepwpnetr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3d3Vkb3dmZHZ4c2Vwd3BuZXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzAyNzksImV4cCI6MjA5MzgwNjI3OX0.w2pKpO5qfjCLSe0EqPY_-TVWuNxWKOKaAtBnp-8V2b4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  }
});
