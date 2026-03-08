-- Quotations table
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  quotation_number text NOT NULL,
  date_issued date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  status text NOT NULL DEFAULT 'draft',
  converted_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  total_discount numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  notes text,
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Delivery Challans table
CREATE TABLE public.delivery_challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  challan_number text NOT NULL,
  date_issued date NOT NULL DEFAULT CURRENT_DATE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  transport_mode text,
  vehicle_number text,
  dispatch_from text,
  dispatch_to text,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.challan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id uuid NOT NULL REFERENCES public.delivery_challans(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Orders table
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_gstin text,
  supplier_address text,
  po_number text NOT NULL,
  date_issued date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery date,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.po_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recurring Templates table
CREATE TABLE public.recurring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  next_generate_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  subtotal numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recurring_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.recurring_templates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- E-Invoice fields on invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS irn_number text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS irn_date timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS e_invoice_status text DEFAULT 'not_generated';

-- Additional number sequences on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_quotation_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quotation_prefix text NOT NULL DEFAULT 'QT-';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_challan_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_po_number integer NOT NULL DEFAULT 1;

-- Enable RLS on all new tables
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotations
CREATE POLICY "Users can view own quotations" ON public.quotations FOR SELECT USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can create own quotations" ON public.quotations FOR INSERT WITH CHECK (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can update own quotations" ON public.quotations FOR UPDATE USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can delete own quotations" ON public.quotations FOR DELETE USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can view own quotation items" ON public.quotation_items FOR SELECT USING (quotation_id IN (SELECT id FROM public.quotations WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can create own quotation items" ON public.quotation_items FOR INSERT WITH CHECK (quotation_id IN (SELECT id FROM public.quotations WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can update own quotation items" ON public.quotation_items FOR UPDATE USING (quotation_id IN (SELECT id FROM public.quotations WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can delete own quotation items" ON public.quotation_items FOR DELETE USING (quotation_id IN (SELECT id FROM public.quotations WHERE profile_id = public.get_user_profile_id()));

-- RLS for delivery challans
CREATE POLICY "Users can view own challans" ON public.delivery_challans FOR SELECT USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can create own challans" ON public.delivery_challans FOR INSERT WITH CHECK (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can update own challans" ON public.delivery_challans FOR UPDATE USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can delete own challans" ON public.delivery_challans FOR DELETE USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can view own challan items" ON public.challan_items FOR SELECT USING (challan_id IN (SELECT id FROM public.delivery_challans WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can create own challan items" ON public.challan_items FOR INSERT WITH CHECK (challan_id IN (SELECT id FROM public.delivery_challans WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can update own challan items" ON public.challan_items FOR UPDATE USING (challan_id IN (SELECT id FROM public.delivery_challans WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can delete own challan items" ON public.challan_items FOR DELETE USING (challan_id IN (SELECT id FROM public.delivery_challans WHERE profile_id = public.get_user_profile_id()));

-- RLS for purchase orders
CREATE POLICY "Users can view own POs" ON public.purchase_orders FOR SELECT USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can create own POs" ON public.purchase_orders FOR INSERT WITH CHECK (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can update own POs" ON public.purchase_orders FOR UPDATE USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can delete own POs" ON public.purchase_orders FOR DELETE USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can view own PO items" ON public.po_items FOR SELECT USING (po_id IN (SELECT id FROM public.purchase_orders WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can create own PO items" ON public.po_items FOR INSERT WITH CHECK (po_id IN (SELECT id FROM public.purchase_orders WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can update own PO items" ON public.po_items FOR UPDATE USING (po_id IN (SELECT id FROM public.purchase_orders WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can delete own PO items" ON public.po_items FOR DELETE USING (po_id IN (SELECT id FROM public.purchase_orders WHERE profile_id = public.get_user_profile_id()));

-- RLS for recurring templates
CREATE POLICY "Users can view own templates" ON public.recurring_templates FOR SELECT USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can create own templates" ON public.recurring_templates FOR INSERT WITH CHECK (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can update own templates" ON public.recurring_templates FOR UPDATE USING (profile_id = public.get_user_profile_id());
CREATE POLICY "Users can delete own templates" ON public.recurring_templates FOR DELETE USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can view own template items" ON public.recurring_template_items FOR SELECT USING (template_id IN (SELECT id FROM public.recurring_templates WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can create own template items" ON public.recurring_template_items FOR INSERT WITH CHECK (template_id IN (SELECT id FROM public.recurring_templates WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can update own template items" ON public.recurring_template_items FOR UPDATE USING (template_id IN (SELECT id FROM public.recurring_templates WHERE profile_id = public.get_user_profile_id()));
CREATE POLICY "Users can delete own template items" ON public.recurring_template_items FOR DELETE USING (template_id IN (SELECT id FROM public.recurring_templates WHERE profile_id = public.get_user_profile_id()));

-- Updated at triggers
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_challans_updated_at BEFORE UPDATE ON public.delivery_challans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.recurring_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();