-- Inw Database Schema
-- Intelligent Invoicing & Inventory Workspace

-- 1. Profiles Table (Business/Organization settings)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gstin TEXT,
  address TEXT,
  state_code TEXT NOT NULL DEFAULT '27',
  logo_url TEXT,
  upi_vpa TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INW-',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Products Table (Inventory & Catalog)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'goods' CHECK (type IN ('goods', 'service')),
  hsn_code TEXT,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_limit INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, sku)
);

-- 3. Clients Table (CRM & Credit/Udhaar)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  gstin TEXT,
  state_code TEXT NOT NULL DEFAULT '27',
  credit_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Invoices Table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid', 'cancelled')),
  date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
  date_due DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'credit', 'split')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, invoice_number)
);

-- 5. Invoice Items Table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Inventory Logs Table
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('invoice_deduction', 'restock', 'correction')),
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's profile_id
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for products
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (profile_id = public.get_user_profile_id());

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (profile_id = public.get_user_profile_id());

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (profile_id = public.get_user_profile_id());

-- RLS Policies for invoice_items (through invoice ownership)
CREATE POLICY "Users can view their own invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE profile_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Users can insert their own invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE profile_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Users can update their own invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE profile_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Users can delete their own invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE profile_id = public.get_user_profile_id()
    )
  );

-- RLS Policies for inventory_logs (through product ownership)
CREATE POLICY "Users can view their own inventory logs"
  ON public.inventory_logs FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE profile_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Users can insert their own inventory logs"
  ON public.inventory_logs FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products WHERE profile_id = public.get_user_profile_id()
    )
  );

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, org_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'org_name', 'My Business'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  SELECT invoice_prefix, next_invoice_number 
  INTO v_prefix, v_number
  FROM public.profiles 
  WHERE id = p_profile_id
  FOR UPDATE;
  
  v_invoice_number := v_prefix || LPAD(v_number::TEXT, 4, '0');
  
  UPDATE public.profiles 
  SET next_invoice_number = next_invoice_number + 1
  WHERE id = p_profile_id;
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to finalize invoice and deduct stock
CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
BEGIN
  -- Update invoice status
  UPDATE public.invoices 
  SET status = 'finalized', updated_at = now()
  WHERE id = p_invoice_id AND status = 'draft';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found or already finalized';
  END IF;
  
  -- Deduct stock for each goods item
  FOR v_item IN 
    SELECT ii.*, p.type as product_type
    FROM public.invoice_items ii
    LEFT JOIN public.products p ON ii.product_id = p.id
    WHERE ii.invoice_id = p_invoice_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.product_type = 'goods' THEN
      -- Update product stock
      UPDATE public.products 
      SET stock_quantity = stock_quantity - v_item.qty
      WHERE id = v_item.product_id;
      
      -- Log the inventory change
      INSERT INTO public.inventory_logs (product_id, change_amount, reason, reference_id)
      VALUES (v_item.product_id, -v_item.qty, 'invoice_deduction', p_invoice_id);
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes for performance
CREATE INDEX idx_products_profile_id ON public.products(profile_id);
CREATE INDEX idx_products_sku ON public.products(profile_id, sku);
CREATE INDEX idx_clients_profile_id ON public.clients(profile_id);
CREATE INDEX idx_invoices_profile_id ON public.invoices(profile_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_inventory_logs_product_id ON public.inventory_logs(product_id);