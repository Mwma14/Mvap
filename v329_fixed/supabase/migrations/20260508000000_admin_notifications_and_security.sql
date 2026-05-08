-- 2026-05-08
-- Security + admin reliability fixes:
-- 1) Remove the need for service_role key inside the client app
-- 2) Fix premium request admin notifications in a safe server-side way
-- 3) Ensure only admins can approve/deny premium requests
-- 4) Allow admins to insert user_roles rows when needed (for migrations / missing rows)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Notifications: tighten INSERT policy (users can only insert for themselves)
--    Server-side SECURITY DEFINER functions can still insert for anyone.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

DO $$
BEGIN
  CREATE POLICY "Users can insert own notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Notify admins about new premium request (no client service key needed)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_admins_new_premium_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _plan_duration text;
  _plan_price text;
  _transaction_id text;
BEGIN
  SELECT pr.user_id, pr.plan_duration, pr.plan_price, pr.transaction_id
  INTO _user_id, _plan_duration, _plan_price, _transaction_id
  FROM public.premium_requests pr
  WHERE pr.id = _request_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Premium request not found';
  END IF;

  -- Only the request owner can trigger the admin notification fan-out.
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
  SELECT
    ur.user_id,
    'New Premium Request',
    'New premium renewal request for ' || COALESCE(_plan_duration, '') ||
      ' (' || COALESCE(_plan_price, '') || '). Transaction ID: ' || COALESCE(_transaction_id, ''),
    'info',
    _request_id,
    'premium_request'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Only admins can approve/deny premium requests (fix missing checks)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_premium_request(_request_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _duration_days integer;
  _current_expires timestamp with time zone;
  _new_expires timestamp with time zone;
  _plan_duration text;
  _premium_type text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _admin_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'admin_id mismatch';
  END IF;

  -- Get request details including premium_type
  SELECT pr.user_id, pp.duration_days, pr.plan_duration, pr.premium_type
  INTO _user_id, _duration_days, _plan_duration, _premium_type
  FROM public.premium_requests pr
  LEFT JOIN public.pricing_plans pp ON pr.plan_id = pp.id
  WHERE pr.id = _request_id AND pr.status = 'pending';

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- If no plan_id match, try to infer duration_days from plan_duration
  IF _duration_days IS NULL THEN
    _duration_days := CASE
      WHEN _plan_duration ILIKE '%year%' THEN 365
      WHEN _plan_duration ILIKE '%6%month%' THEN 180
      ELSE 30
    END;
  END IF;

  -- Default premium_type to 'gold' if not set
  IF _premium_type IS NULL OR _premium_type = '' THEN
    _premium_type := 'gold';
  END IF;

  -- Get current expiry
  SELECT ur.premium_expires_at INTO _current_expires
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id;

  -- Calculate new expiry (extend from current if still valid, otherwise from now)
  IF _current_expires IS NOT NULL AND _current_expires > now() THEN
    _new_expires := _current_expires + (_duration_days || ' days')::interval;
  ELSE
    _new_expires := now() + (_duration_days || ' days')::interval;
  END IF;

  -- Update user role to premium with correct premium_type (gold/platinum)
  UPDATE public.user_roles
  SET role = 'premium',
      premium_expires_at = _new_expires,
      premium_type = _premium_type,
      max_devices = CASE WHEN _premium_type = 'platinum' THEN 3 ELSE 2 END
  WHERE user_id = _user_id;

  -- Update request status
  UPDATE public.premium_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _request_id;

  -- Create notification for user
  INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (
    _user_id,
    'Premium Approved!',
    'Your premium request has been approved. Enjoy your ' || _plan_duration || ' ' || initcap(_premium_type) || ' subscription!',
    'success',
    _request_id,
    'premium_request'
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.deny_premium_request(_request_id uuid, _admin_id uuid, _reason text DEFAULT 'Request denied')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _admin_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'admin_id mismatch';
  END IF;

  SELECT pr.user_id INTO _user_id
  FROM public.premium_requests pr
  WHERE pr.id = _request_id AND pr.status = 'pending';

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Update request status
  UPDATE public.premium_requests
  SET status = 'denied',
      admin_note = _reason,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _request_id;

  -- Create notification for user
  INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (
    _user_id,
    'Premium Request Denied',
    'Your premium request has been denied. Reason: ' || _reason,
    'error',
    _request_id,
    'premium_request'
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) user_roles: allow admins to insert role rows (useful if role rows are missing)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  CREATE POLICY "Admins can insert roles"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

