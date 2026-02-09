
-- Create function to get profiles with their roles
CREATE OR REPLACE FUNCTION public.get_profiles_with_roles()
RETURNS TABLE (
  id text,
  inspector_name text,
  emp_id text,
  phone text,
  email text,
  role text,
  active boolean,
  created_at timestamptz,
  app_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.inspector_name,
    p.emp_id,
    p.phone,
    p.email,
    p.role,
    p.active,
    p.created_at,
    ur.role::text as app_role
  FROM profile p
  LEFT JOIN auth.users au ON au.email = p.email
  LEFT JOIN user_roles ur ON ur.user_id = au.id::text
$$;
