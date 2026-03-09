
-- Freelancer projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  budget NUMERIC,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (profile_id = get_user_profile_id());

-- Milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones" ON public.project_milestones FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own milestones" ON public.project_milestones FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own milestones" ON public.project_milestones FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own milestones" ON public.project_milestones FOR DELETE USING (profile_id = get_user_profile_id());

-- Time entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT,
  hours NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own time entries" ON public.time_entries FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own time entries" ON public.time_entries FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own time entries" ON public.time_entries FOR DELETE USING (profile_id = get_user_profile_id());
