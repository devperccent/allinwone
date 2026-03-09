
-- Email digest preferences table
CREATE TABLE public.email_digest_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_digest boolean NOT NULL DEFAULT false,
  weekly_digest boolean NOT NULL DEFAULT true,
  monthly_digest boolean NOT NULL DEFAULT true,
  digest_email text,
  daily_time time NOT NULL DEFAULT '18:00:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE public.email_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digest prefs"
  ON public.email_digest_preferences FOR SELECT
  TO authenticated
  USING (profile_id = get_user_profile_id());

CREATE POLICY "Users can insert own digest prefs"
  ON public.email_digest_preferences FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = get_user_profile_id());

CREATE POLICY "Users can update own digest prefs"
  ON public.email_digest_preferences FOR UPDATE
  TO authenticated
  USING (profile_id = get_user_profile_id());

CREATE POLICY "Users can delete own digest prefs"
  ON public.email_digest_preferences FOR DELETE
  TO authenticated
  USING (profile_id = get_user_profile_id());

-- Auto-update updated_at
CREATE TRIGGER update_email_digest_prefs_updated_at
  BEFORE UPDATE ON public.email_digest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
