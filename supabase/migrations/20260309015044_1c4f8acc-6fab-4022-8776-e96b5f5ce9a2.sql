-- Add suspended flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;

-- Announcements table for admin broadcasts
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read active announcements
CREATE POLICY "Anyone can view active announcements" 
ON public.announcements FOR SELECT 
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Only admins can insert announcements
CREATE POLICY "Admins can insert announcements" 
ON public.announcements FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements" 
ON public.announcements FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements" 
ON public.announcements FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin policy for profile suspension updates
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));