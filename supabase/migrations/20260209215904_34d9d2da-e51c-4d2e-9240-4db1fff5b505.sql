
-- Drop the foreign key constraint first
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Now update user_roles to use auth.users.id instead of profile.id
UPDATE public.user_roles ur
SET user_id = au.id::text
FROM public.profile p, auth.users au
WHERE ur.user_id = p.id
  AND p.email = au.email;
