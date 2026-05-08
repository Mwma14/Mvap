/**
 * IMPORTANT SECURITY CHANGE:
 * We DO NOT ship Supabase service_role keys inside the app anymore.
 *
 * If something needs to bypass RLS, do it server-side (Supabase Edge Functions / DB SECURITY DEFINER functions).
 *
 * For admin UI actions that are already protected by RLS (has_role(auth.uid(),'admin')),
 * the normal client is enough.
 */
import { supabase } from './client';

// Backward-compatible alias so existing imports keep working.
// This does NOT bypass RLS.
export const supabaseAdmin = supabase;
