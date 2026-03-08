
-- 1. Add barcode column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text;

-- 2. Create purchase_bills table (inward stock from suppliers)
CREATE TABLE public.purchase_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_gstin text,
  supplier_address text,
  bill_number text NOT NULL,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  received_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.purchase_bills(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  batch_number text,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create product_batches table for batch/expiry tracking
CREATE TABLE public.product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  expiry_date date,
  quantity integer NOT NULL DEFAULT 0,
  purchase_bill_id uuid REFERENCES public.purchase_bills(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add expiry_alert_days to profiles (configurable days before expiry to alert)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expiry_alert_days integer NOT NULL DEFAULT 30;

-- 5. Add default_supplier_name to products for auto-PO suggestions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_supplier_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_supplier_gstin text;

-- 6. RLS for purchase_bills
ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchase bills" ON public.purchase_bills
  FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own purchase bills" ON public.purchase_bills
  FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own purchase bills" ON public.purchase_bills
  FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own purchase bills" ON public.purchase_bills
  FOR DELETE USING (profile_id = get_user_profile_id());

-- 7. RLS for purchase_bill_items
ALTER TABLE public.purchase_bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bill items" ON public.purchase_bill_items
  FOR SELECT USING (bill_id IN (SELECT id FROM public.purchase_bills WHERE profile_id = get_user_profile_id()));
CREATE POLICY "Users can create own bill items" ON public.purchase_bill_items
  FOR INSERT WITH CHECK (bill_id IN (SELECT id FROM public.purchase_bills WHERE profile_id = get_user_profile_id()));
CREATE POLICY "Users can update own bill items" ON public.purchase_bill_items
  FOR UPDATE USING (bill_id IN (SELECT id FROM public.purchase_bills WHERE profile_id = get_user_profile_id()));
CREATE POLICY "Users can delete own bill items" ON public.purchase_bill_items
  FOR DELETE USING (bill_id IN (SELECT id FROM public.purchase_bills WHERE profile_id = get_user_profile_id()));

-- 8. RLS for product_batches
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches" ON public.product_batches
  FOR SELECT USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can create own batches" ON public.product_batches
  FOR INSERT WITH CHECK (profile_id = get_user_profile_id());
CREATE POLICY "Users can update own batches" ON public.product_batches
  FOR UPDATE USING (profile_id = get_user_profile_id());
CREATE POLICY "Users can delete own batches" ON public.product_batches
  FOR DELETE USING (profile_id = get_user_profile_id());

-- 9. Function to finalize a purchase bill (auto-update stock)
CREATE OR REPLACE FUNCTION public.finalize_purchase_bill(p_bill_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_user_profile_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id INTO v_user_profile_id
  FROM public.profiles WHERE user_id = auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_bills
    WHERE id = p_bill_id AND profile_id = v_user_profile_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.purchase_bills
  SET status = 'received', updated_at = now()
  WHERE id = p_bill_id AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found or already received';
  END IF;

  FOR v_item IN
    SELECT pbi.*, p.type as product_type
    FROM public.purchase_bill_items pbi
    LEFT JOIN public.products p ON pbi.product_id = p.id
    WHERE pbi.bill_id = p_bill_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.product_type = 'goods' THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity + v_item.qty
      WHERE id = v_item.product_id;

      INSERT INTO public.inventory_logs (product_id, change_amount, reason, reference_id)
      VALUES (v_item.product_id, v_item.qty, 'purchase_inward', p_bill_id);

      -- Create/update batch if batch_number provided
      IF v_item.batch_number IS NOT NULL AND v_item.batch_number <> '' THEN
        INSERT INTO public.product_batches (product_id, profile_id, batch_number, expiry_date, quantity, purchase_bill_id)
        VALUES (v_item.product_id, v_user_profile_id, v_item.batch_number, v_item.expiry_date, v_item.qty, p_bill_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- 10. Trigger to notify for expiring batches (runs on batch insert/update)
CREATE OR REPLACE FUNCTION public.notify_expiring_batches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_alert_days integer;
  v_product_name text;
BEGIN
  IF NEW.expiry_date IS NULL THEN RETURN NEW; END IF;

  SELECT expiry_alert_days INTO v_alert_days
  FROM public.profiles WHERE id = NEW.profile_id;

  SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;

  IF NEW.expiry_date <= (CURRENT_DATE + (COALESCE(v_alert_days, 30) || ' days')::interval) THEN
    INSERT INTO public.notifications (profile_id, title, message, type, entity_type, entity_id)
    VALUES (
      NEW.profile_id,
      'Batch Expiring Soon',
      v_product_name || ' (Batch: ' || NEW.batch_number || ') expires on ' || NEW.expiry_date::text,
      'warning',
      'product',
      NEW.product_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_expiring_batches
  AFTER INSERT OR UPDATE ON public.product_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_expiring_batches();
