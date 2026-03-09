
-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'miscellaneous',
  description text,
  payment_mode text NOT NULL DEFAULT 'cash',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own expenses" ON public.expenses FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (profile_id = get_user_profile_id());

-- Payments table (partial payments tracking)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE USING (profile_id = get_user_profile_id());

-- Payment reminders table
CREATE TABLE public.payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  reminder_type text NOT NULL DEFAULT 'friendly',
  channel text NOT NULL DEFAULT 'whatsapp',
  sent_at timestamptz NOT NULL DEFAULT now(),
  follow_up_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.payment_reminders FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own reminders" ON public.payment_reminders FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own reminders" ON public.payment_reminders FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own reminders" ON public.payment_reminders FOR DELETE USING (profile_id = get_user_profile_id());

-- Credit notes table
CREATE TABLE public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  credit_note_number text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'issued',
  date_issued date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit notes" ON public.credit_notes FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own credit notes" ON public.credit_notes FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own credit notes" ON public.credit_notes FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own credit notes" ON public.credit_notes FOR DELETE USING (profile_id = get_user_profile_id());

-- Add credit_limit and credit_days to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_days integer DEFAULT 30;

-- Add business_mode to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_mode text DEFAULT 'retail';

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT DO NOTHING;

-- RLS for receipts bucket
CREATE POLICY "Users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Users can delete own receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
