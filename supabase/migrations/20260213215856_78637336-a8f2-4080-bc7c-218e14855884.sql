
-- Add share_token to invoices for public shareable links
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for fast lookup by share_token
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token) WHERE share_token IS NOT NULL;

-- Add payment_date column for tracking when payment was received
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Function to generate a random share token
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Allow public (anonymous) read access to invoices by share_token
CREATE POLICY "Public can view invoices by share token"
ON public.invoices
FOR SELECT
USING (share_token IS NOT NULL AND share_token != '');

-- Allow public read access to invoice_items for shared invoices
CREATE POLICY "Public can view items of shared invoices"
ON public.invoice_items
FOR SELECT
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE share_token IS NOT NULL AND share_token != ''
));

-- Allow public read access to client details for shared invoices
CREATE POLICY "Public can view clients of shared invoices"
ON public.clients
FOR SELECT
USING (id IN (
  SELECT client_id FROM public.invoices WHERE share_token IS NOT NULL AND share_token != '' AND client_id IS NOT NULL
));
