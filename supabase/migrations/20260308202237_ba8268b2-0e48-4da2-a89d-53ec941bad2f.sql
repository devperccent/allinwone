ALTER TABLE public.profiles 
ADD COLUMN enabled_modules text[] NOT NULL DEFAULT ARRAY['quick_bill', 'quotations', 'challans', 'purchase_orders', 'recurring', 'reports'];