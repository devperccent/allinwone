
-- TDS Entries table for tracking TDS deducted by clients
CREATE TABLE public.tds_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  tds_section TEXT NOT NULL DEFAULT '194C',
  tds_rate NUMERIC NOT NULL DEFAULT 2,
  tds_amount NUMERIC NOT NULL DEFAULT 0,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  date_deducted DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_number TEXT,
  financial_year TEXT NOT NULL,
  quarter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tds_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TDS entries" ON public.tds_entries FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own TDS entries" ON public.tds_entries FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own TDS entries" ON public.tds_entries FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own TDS entries" ON public.tds_entries FOR DELETE USING (profile_id = get_user_profile_id());

CREATE TRIGGER update_tds_entries_updated_at BEFORE UPDATE ON public.tds_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
