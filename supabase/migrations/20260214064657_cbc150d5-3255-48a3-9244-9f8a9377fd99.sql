-- Add new profile columns for enhanced onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pan_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_account_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_account_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_ifsc text DEFAULT NULL;