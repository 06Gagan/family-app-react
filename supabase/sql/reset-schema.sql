-- Reset the core tables and policies for FamilySync

-- Remove policies
DROP POLICY IF EXISTS "family members manage child activities" ON public.child_activities;
DROP POLICY IF EXISTS "family members manage chores" ON public.chores;
DROP POLICY IF EXISTS "family members manage meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;
DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "select profiles in my family" ON public.profiles;
DROP POLICY IF EXISTS "insert family" ON public.families;
DROP POLICY IF EXISTS "select own family" ON public.families;

-- Remove triggers and functions
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.current_user_family_id();

-- Remove tables
DROP TABLE IF EXISTS public.child_activities CASCADE;
DROP TABLE IF EXISTS public.chores CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- Required extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------------
-- Core tables
---------------------------------------------------------

CREATE TABLE public.families (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_name text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  role       text NOT NULL CHECK (role in ('admin','parent','child','cook','driver')),
  family_id  uuid REFERENCES public.families(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.meal_plans (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  family_id           uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  meals_json          jsonb NOT NULL,
  week_start          date NOT NULL,
  assigned_to_cook_id uuid REFERENCES public.profiles(id),
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE public.chores (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id            uuid REFERENCES public.families(id) ON DELETE CASCADE,
  assigned_to_child_id uuid REFERENCES public.profiles(id),
  task                 text NOT NULL,
  due_date             date,
  status               text DEFAULT 'pending',
  reward_points        integer DEFAULT 10,
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE public.child_activities (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id             uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL REFERENCES public.profiles(id),
  title                 text NOT NULL,
  date                  date NOT NULL,
  time                  time NOT NULL,
  location              text,
  assigned_to_driver_id uuid REFERENCES public.profiles(id),
  created_at            timestamptz DEFAULT now()
);

---------------------------------------------------------
-- Helper functions and triggers
---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY definer
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Automatically create a profile when a new auth user is registered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, role)
  VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data->>'full_name', NEW.user_metadata->>'full_name'),
      coalesce(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

---------------------------------------------------------
-- Enable Row Level Security
---------------------------------------------------------
ALTER TABLE public.families        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_activities ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------
-- Policies
---------------------------------------------------------

-- Families
CREATE POLICY "select own family"
ON public.families
FOR SELECT
USING (id = public.current_user_family_id());

CREATE POLICY "insert family"
ON public.families
FOR INSERT
WITH CHECK (auth.role() <> 'anon');

-- Profiles
CREATE POLICY "select profiles in my family"
ON public.profiles
FOR SELECT
USING (family_id = public.current_user_family_id());

CREATE POLICY "insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Meal plans
CREATE POLICY "family members manage meal plans"
ON public.meal_plans
FOR ALL
USING  (family_id = public.current_user_family_id())
WITH CHECK (family_id = public.current_user_family_id());

-- Chores
CREATE POLICY "family members manage chores"
ON public.chores
FOR ALL
USING  (family_id = public.current_user_family_id())
WITH CHECK (family_id = public.current_user_family_id());

-- Child activities
CREATE POLICY "family members manage child activities"
ON public.child_activities
FOR ALL
USING  (family_id = public.current_user_family_id())
WITH CHECK (family_id = public.current_user_family_id());


