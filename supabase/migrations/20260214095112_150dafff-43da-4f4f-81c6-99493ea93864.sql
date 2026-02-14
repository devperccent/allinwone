
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, error
  entity_type TEXT, -- invoice, client, product, system
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_notifications_profile_read ON public.notifications(profile_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (profile_id = get_user_profile_id());

CREATE POLICY "Users can insert their own notifications"
ON public.notifications FOR INSERT
WITH CHECK (profile_id = get_user_profile_id());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (profile_id = get_user_profile_id());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (profile_id = get_user_profile_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify on invoice finalized or paid
CREATE OR REPLACE FUNCTION public.notify_invoice_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.profile_id, 'Invoice Created', 'Invoice ' || NEW.invoice_number || ' has been created.', 'info', 'invoice', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'finalized' THEN
        INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
        VALUES (NEW.profile_id, 'Invoice Finalized', 'Invoice ' || NEW.invoice_number || ' is now finalized.', 'success', 'invoice', NEW.id);
      ELSIF NEW.status = 'paid' THEN
        INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
        VALUES (NEW.profile_id, 'Payment Received', 'Invoice ' || NEW.invoice_number || ' has been marked as paid.', 'success', 'invoice', NEW.id);
      ELSIF NEW.status = 'cancelled' THEN
        INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
        VALUES (NEW.profile_id, 'Invoice Cancelled', 'Invoice ' || NEW.invoice_number || ' has been cancelled.', 'warning', 'invoice', NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_notify_invoice
AFTER INSERT OR UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_event();

-- Trigger: notify on low stock after inventory deduction
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type = 'goods' AND NEW.stock_quantity <= NEW.low_stock_limit AND
     (OLD.stock_quantity IS NULL OR OLD.stock_quantity > OLD.low_stock_limit) THEN
    INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.profile_id, 'Low Stock Alert', NEW.name || ' has only ' || NEW.stock_quantity || ' units left.', 'warning', 'product', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_low_stock
AFTER UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

-- Trigger: notify on new client
CREATE OR REPLACE FUNCTION public.notify_client_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
  VALUES (NEW.profile_id, 'New Client Added', NEW.name || ' has been added to your client list.', 'info', 'client', NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_client_created
AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.notify_client_created();
