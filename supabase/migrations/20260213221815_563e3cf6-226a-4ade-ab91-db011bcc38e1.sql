
-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_activity_logs_profile_id ON public.activity_logs(profile_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (profile_id = get_user_profile_id());

CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (profile_id = get_user_profile_id());

-- Trigger function: log invoice changes
CREATE OR REPLACE FUNCTION public.log_invoice_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (NEW.profile_id, v_action, 'invoice', NEW.id, NEW.invoice_number);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'finalized' THEN v_action := 'finalized';
      ELSIF NEW.status = 'paid' THEN v_action := 'marked_paid';
      ELSE v_action := 'updated';
      END IF;
    ELSE
      v_action := 'updated';
    END IF;
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (NEW.profile_id, v_action, 'invoice', NEW.id, NEW.invoice_number);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (OLD.profile_id, 'deleted', 'invoice', OLD.id, OLD.invoice_number);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_invoice_activity
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.log_invoice_activity();

-- Trigger function: log client changes
CREATE OR REPLACE FUNCTION public.log_client_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (NEW.profile_id, 'created', 'client', NEW.id, NEW.name);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (NEW.profile_id, 'updated', 'client', NEW.id, NEW.name);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (OLD.profile_id, 'deleted', 'client', OLD.id, OLD.name);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_client_activity
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_client_activity();

-- Trigger function: log product changes
CREATE OR REPLACE FUNCTION public.log_product_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (NEW.profile_id, 'created', 'product', NEW.id, NEW.name);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if stock changed (inventory adjustment)
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
      INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label, metadata)
      VALUES (NEW.profile_id, 'stock_adjusted', 'product', NEW.id, NEW.name, 
        jsonb_build_object('old_qty', OLD.stock_quantity, 'new_qty', NEW.stock_quantity));
    ELSE
      INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
      VALUES (NEW.profile_id, 'updated', 'product', NEW.id, NEW.name);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (profile_id, action, entity_type, entity_id, entity_label)
    VALUES (OLD.profile_id, 'deleted', 'product', OLD.id, OLD.name);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_product_activity
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_product_activity();
