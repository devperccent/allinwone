-- Add signature_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text DEFAULT NULL;

-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT DO NOTHING;

-- RLS for signatures bucket
CREATE POLICY "Users can upload own signatures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own signatures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own signatures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view signatures" ON storage.objects FOR SELECT TO public USING (bucket_id = 'signatures');