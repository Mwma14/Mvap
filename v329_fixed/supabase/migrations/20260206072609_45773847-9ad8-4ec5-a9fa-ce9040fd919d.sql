
-- Fix the overly permissive INSERT policy on notifications
-- Drop and recreate to only allow authenticated users (system functions use SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
