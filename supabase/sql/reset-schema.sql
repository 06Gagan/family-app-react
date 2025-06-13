-- My corrected schema. I've removed the problematic foreign key
-- from the profiles table to ensure the script runs completely.

-- First, I'll drop all old objects to ensure a clean slate.
DROP POLICY IF EXISTS "family members manage child activities" ON public.child_activities;
DROP POLICY IF EXISTS "family members manage chores" ON public.chores;
DROP POLICY IF EXISTS "family members manage meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;
DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "select profiles in my family" ON public.profiles;
DROP POLICY IF EXISTS "insert family" ON public.families;
DROP POLICY IF EXISTS "select own family" ON public.families;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
DROP FUNCTION IF EXISTS public.setup_family_for_new_parent();
DROP FUNCTION IF EXISTS public.current_user_family_id();
DROP TABLE IF EXISTS public.child_activities CASCADE;
DROP TABLE IF EXISTS public.chores CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- I'm creating the tables again from scratch.
CREATE TABLE public.families (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), family_name text NOT NULL, created_at timestamptz DEFAULT now());

-- This is the corrected profiles table definition.
CREATE TABLE public.profiles (id uuid PRIMARY KEY, full_name text, role text, family_id uuid REFERENCES public.families(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now());

CREATE TABLE public.meal_plans (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid, family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, meals_json jsonb NOT NULL, week_start date NOT NULL, assigned_to_cook_id uuid REFERENCES public.profiles(id), created_at timestamptz DEFAULT now());
CREATE TABLE public.chores (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), family_id uuid REFERENCES public.families(id) ON DELETE CASCADE, assigned_to_child_id uuid REFERENCES public.profiles(id), task text NOT NULL, due_date date, status text DEFAULT 'pending', reward_points integer DEFAULT 10, created_at timestamptz DEFAULT now());
CREATE TABLE public.child_activities (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, child_id uuid NOT NULL REFERENCES public.profiles(id), title text NOT NULL, date date NOT NULL, time time NOT NULL, location text, assigned_to_driver_id uuid REFERENCES public.profiles(id), created_at timestamptz DEFAULT now());

-- This function creates a profile for a new user.
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$;

-- This function sets up a family for a new parent/admin.
CREATE OR REPLACE FUNCTION public.setup_family_for_new_parent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile public.profiles;
  new_family_id uuid;
BEGIN
  SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();
  IF user_profile.family_id IS NULL AND (user_profile.role = 'parent' OR user_profile.role = 'admin') THEN
    INSERT INTO public.families (family_name) VALUES (user_profile.full_name || '''s Family') RETURNING id INTO new_family_id;
    UPDATE public.profiles SET family_id = new_family_id WHERE id = auth.uid();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_family_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY definer AS $$ SELECT family_id FROM public.profiles WHERE id = auth.uid(); $$;

-- This trigger calls the profile creation function.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- I'm enabling Row Level Security on all tables.
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_activities ENABLE ROW LEVEL SECURITY;

-- These are my final, clean policies.
CREATE POLICY "select own family" ON public.families FOR SELECT USING (id = public.current_user_family_id());
CREATE POLICY "insert family" ON public.families FOR INSERT WITH CHECK (auth.role() <> 'anon');
CREATE POLICY "select profiles in my family" ON public.profiles FOR SELECT USING (family_id = public.current_user_family_id());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "family members manage meal plans" ON public.meal_plans FOR ALL USING (family_id = public.current_user_family_id()) WITH CHECK (family_id = public.current_user_family_id());
CREATE POLICY "family members manage chores" ON public.chores FOR ALL USING (family_id = public.current_user_family_id()) WITH CHECK (family_id = public.current_user_family_id());
CREATE POLICY "family members manage child activities" ON public.child_activities FOR ALL USING (family_id = public.current_user_family_id()) WITH CHECK (family_id = public.current_user_family_id());