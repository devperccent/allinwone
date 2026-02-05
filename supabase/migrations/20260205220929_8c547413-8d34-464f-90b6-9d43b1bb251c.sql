-- Fix function search path mutable warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.generate_invoice_number(UUID) SET search_path = public;
ALTER FUNCTION public.finalize_invoice(UUID) SET search_path = public;