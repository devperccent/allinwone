-- Create table to track AI usage per user for rate limiting and model fallback
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  query_count INTEGER DEFAULT 1,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('day', now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_ai_usage_profile_period ON public.ai_usage_logs(profile_id, period_start);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI usage" 
ON public.ai_usage_logs 
FOR SELECT 
USING (profile_id = get_user_profile_id());

-- System can insert usage logs (via service role in edge functions)
CREATE POLICY "System can insert AI usage logs" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all AI usage" 
ON public.ai_usage_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Add AI rate limit settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_queries_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_last_query_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'standard';