
ALTER TABLE public.inventory_logs DROP CONSTRAINT inventory_logs_reason_check;
ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_reason_check 
  CHECK (reason = ANY (ARRAY['invoice_deduction'::text, 'restock'::text, 'correction'::text, 'purchase_inward'::text]));
