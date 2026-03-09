-- Add payment_reference column for cheque/NEFT/RTGS tracking
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_reference text DEFAULT NULL;

-- Update payment_mode to support more Indian payment types
-- (payment_mode is text, so no enum change needed - we just use new values in the app)