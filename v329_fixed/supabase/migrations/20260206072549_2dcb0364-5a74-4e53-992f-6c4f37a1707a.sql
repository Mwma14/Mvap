
-- Payment methods table (admin-editable)
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  gradient TEXT NOT NULL DEFAULT 'bg-gradient-to-br from-blue-400 to-blue-500',
  text_color TEXT NOT NULL DEFAULT 'text-white',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment methods"
  ON public.payment_methods FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment methods"
  ON public.payment_methods FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Pricing plans table (admin-editable)
CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duration TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert pricing plans"
  ON public.pricing_plans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pricing plans"
  ON public.pricing_plans FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pricing plans"
  ON public.pricing_plans FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Premium requests table
CREATE TABLE public.premium_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.pricing_plans(id),
  plan_duration TEXT NOT NULL,
  plan_price TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own premium requests"
  ON public.premium_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all premium requests"
  ON public.premium_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own premium requests"
  ON public.premium_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update premium requests"
  ON public.premium_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete premium requests"
  ON public.premium_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update notifications"
  ON public.notifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed default payment methods
INSERT INTO public.payment_methods (name, account_number, account_name, gradient, text_color, display_order) VALUES
  ('KBZ Pay', '095413694', 'Hay Thar Thaw', 'bg-gradient-to-br from-blue-400 to-blue-500', 'text-white', 1),
  ('Wave Pay', '095413694', 'Hay Thar Thaw', 'bg-gradient-to-br from-yellow-300 to-yellow-400', 'text-gray-900', 2),
  ('AYA Pay', '095413694', 'Hay Thar Thaw', 'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400', 'text-white', 3),
  ('CB Pay', '095413694', 'Hay Thar Thaw', 'bg-gradient-to-br from-teal-600 to-teal-700', 'text-white', 4),
  ('UAB Pay', '095413694', 'Hay Thar Thaw', 'bg-gradient-to-br from-emerald-600 to-emerald-700', 'text-white', 5);

-- Seed default pricing plans
INSERT INTO public.pricing_plans (duration, duration_days, price, display_order) VALUES
  ('1 Month', 30, '5000 MMK', 1),
  ('6 Months', 180, '25000 MMK', 2),
  ('1 Year', 365, '50000 MMK', 3);

-- Add triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_premium_requests_updated_at
  BEFORE UPDATE ON public.premium_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve premium request and extend subscription
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
BEGIN
  -- Get request details
  SELECT pr.user_id, pp.duration_days, pr.plan_duration
  INTO _user_id, _duration_days, _plan_duration
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

  -- Get current expiry
  SELECT premium_expires_at INTO _current_expires
  FROM user_roles WHERE user_id = _user_id;

  -- Calculate new expiry (extend from current if still valid, otherwise from now)
  IF _current_expires IS NOT NULL AND _current_expires > now() THEN
    _new_expires := _current_expires + (_duration_days || ' days')::interval;
  ELSE
    _new_expires := now() + (_duration_days || ' days')::interval;
  END IF;

  -- Update user role to premium
  UPDATE user_roles
  SET role = 'premium',
      premium_expires_at = _new_expires,
      premium_type = _plan_duration
  WHERE user_id = _user_id;

  -- Update request status
  UPDATE premium_requests
  SET status = 'approved',
      reviewed_by = _admin_id,
      reviewed_at = now()
  WHERE id = _request_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (_user_id, 'Premium Approved!', 'Your premium request has been approved. Enjoy your ' || _plan_duration || ' subscription!', 'success', _request_id, 'premium_request');
END;
$$;

-- Function to deny premium request
CREATE OR REPLACE FUNCTION public.deny_premium_request(_request_id uuid, _admin_id uuid, _reason text DEFAULT 'Request denied')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT user_id INTO _user_id
  FROM premium_requests
  WHERE id = _request_id AND status = 'pending';

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Update request status
  UPDATE premium_requests
  SET status = 'denied',
      admin_note = _reason,
      reviewed_by = _admin_id,
      reviewed_at = now()
  WHERE id = _request_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (_user_id, 'Premium Request Denied', 'Your premium request has been denied. Reason: ' || _reason, 'error', _request_id, 'premium_request');
END;
$$;
