-- Fix #1: Add explicit NULL check for auth.uid() in get_user_profile_id
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  END
$$;

-- Fix #2: Add authorization check to generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_profile_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Verify caller owns this profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_profile_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this profile';
  END IF;
  
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
$$;

-- Fix #3: Add authorization check to finalize_invoice
CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_user_profile_id UUID;
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;
  
  -- Get caller's profile_id
  SELECT id INTO v_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF v_user_profile_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No profile found';
  END IF;
  
  -- Verify caller owns this invoice
  IF NOT EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE id = p_invoice_id AND profile_id = v_user_profile_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this invoice';
  END IF;
  
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
$$;

-- Fix #4: Strengthen RLS on profiles table to explicitly require authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());