
-- Add premium_type column to premium_requests to store gold/platinum selection
ALTER TABLE public.premium_requests 
ADD COLUMN premium_type text DEFAULT 'gold';

-- Update the approve_premium_request function to use the premium_type from the request
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
  -- Get request details including premium_type
  SELECT pr.user_id, pp.duration_days, pr.plan_duration, pr.premium_type
  INTO _user_id, _duration_days, _plan_duration, _premium_type
  FROM premium_requests pr
  LEFT JOIN pricing_plans pp ON pr.plan_id = pp.id
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
  SELECT premium_expires_at INTO _current_expires
  FROM user_roles WHERE user_id = _user_id;

  -- Calculate new expiry (extend from current if still valid, otherwise from now)
  IF _current_expires IS NOT NULL AND _current_expires > now() THEN
    _new_expires := _current_expires + (_duration_days || ' days')::interval;
  ELSE
    _new_expires := now() + (_duration_days || ' days')::interval;
  END IF;

  -- Update user role to premium with correct premium_type (gold/platinum)
  UPDATE user_roles
  SET role = 'premium',
      premium_expires_at = _new_expires,
      premium_type = _premium_type,
      max_devices = CASE WHEN _premium_type = 'platinum' THEN 3 ELSE 2 END
  WHERE user_id = _user_id;

  -- Update request status
  UPDATE premium_requests
  SET status = 'approved',
      reviewed_by = _admin_id,
      reviewed_at = now()
  WHERE id = _request_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (_user_id, 'Premium Approved!', 'Your premium request has been approved. Enjoy your ' || _plan_duration || ' ' || initcap(_premium_type) || ' subscription!', 'success', _request_id, 'premium_request');
END;
$$;
