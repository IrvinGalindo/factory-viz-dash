-- Create enum for roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'engineer', 'inspector');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix for existing user_role_type enum if it exists (Manually created legacy type)
DO $$ BEGIN
    ALTER TYPE public.user_role_type ADD VALUE 'engineer';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Ensure role constraint exists (Manually created or not)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_check') THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role::text IN ('admin', 'engineer', 'inspector'));
    END IF;
END $$;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profile (currently has none)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles: only admins can manage roles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Anyone can read user_roles'
    ) THEN
        CREATE POLICY "Anyone can read user_roles" ON public.user_roles FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can insert user_roles'
    ) THEN
        CREATE POLICY "Admins can insert user_roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can update user_roles'
    ) THEN
        CREATE POLICY "Admins can update user_roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can delete user_roles'
    ) THEN
        CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

-- RLS policies for profile table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profile' AND policyname = 'Anyone can read profiles'
    ) THEN
        CREATE POLICY "Anyone can read profiles" ON public.profile FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profile' AND policyname = 'Admins can insert profiles'
    ) THEN
        CREATE POLICY "Admins can insert profiles" ON public.profile FOR INSERT WITH CHECK (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profile' AND policyname = 'Admins can update profiles'
    ) THEN
        CREATE POLICY "Admins can update profiles" ON public.profile FOR UPDATE USING (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profile' AND policyname = 'Admins can delete profiles'
    ) THEN
        CREATE POLICY "Admins can delete profiles" ON public.profile FOR DELETE USING (public.has_role(auth.uid()::text, 'admin'));
    END IF;
END $$;

-- Seed existing profiles with roles based on their current role column
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN LOWER(role) = 'admin' THEN 'admin'::app_role
    WHEN LOWER(role) = 'engineer' THEN 'engineer'::app_role
    ELSE 'inspector'::app_role
  END
FROM public.profile
ON CONFLICT (user_id, role) DO NOTHING;
