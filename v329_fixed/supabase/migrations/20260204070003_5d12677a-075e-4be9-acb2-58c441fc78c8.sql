-- Promote user to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '03fa1d33-bea1-491d-b2d9-471f55afd6de';