import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseBill {
  id: string;
  profile_id: string;
  supplier_name: string;
  supplier_gstin: string | null;
  supplier_address: string | null;
  bill_number: string;
  bill_date: string;
  received_date: string | null;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseBillItem[];
}

export interface PurchaseBillItem {
  id: string;
  bill_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  amount: number;
  sort_order: number;
  batch_number: string | null;
  expiry_date: string | null;
}

interface CreateBillData {
  supplier_name: string;
  supplier_gstin?: string | null;
  supplier_address?: string | null;
  bill_number: string;
  bill_date: string;
  received_date?: string | null;
  notes?: string | null;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  items: Omit<PurchaseBillItem, 'id' | 'bill_id'>[];
}

export function usePurchaseBills() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['purchase_bills', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('purchase_bills' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PurchaseBill[];
    },
    enabled: !!profile?.id,
  });

  const createBill = useMutation({
    mutationFn: async (data: CreateBillData) => {
      if (!profile?.id) throw new Error('No profile');

      const { data: bill, error } = await supabase
        .from('purchase_bills' as any)
        .insert({
          profile_id: profile.id,
          supplier_name: data.supplier_name,
          supplier_gstin: data.supplier_gstin || null,
          supplier_address: data.supplier_address || null,
          bill_number: data.bill_number,
          bill_date: data.bill_date,
          received_date: data.received_date || null,
          notes: data.notes || null,
          subtotal: data.subtotal,
          total_tax: data.total_tax,
          grand_total: data.grand_total,
          status: 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (data.items.length > 0) {
        const items = data.items.map((item, idx) => ({
          bill_id: (bill as any).id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          amount: item.amount,
          sort_order: idx,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        }));
        const { error: itemsError } = await supabase.from('purchase_bill_items' as any).insert(items as any);
        if (itemsError) throw itemsError;
      }

      return bill as unknown as PurchaseBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_bills'] });
      toast({ title: 'Purchase bill created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateBill = useMutation({
    mutationFn: async ({
      id, items, ...updates
    }: Partial<Omit<PurchaseBill, 'items'>> & { id: string; items?: Omit<PurchaseBillItem, 'id' | 'bill_id'>[] }) => {
      const { data, error } = await supabase
        .from('purchase_bills' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (items) {
        await supabase.from('purchase_bill_items' as any).delete().eq('bill_id', id);
        const newItems = items.map((item, idx) => ({
          bill_id: id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          amount: item.amount,
          sort_order: idx,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        }));
        if (newItems.length > 0) {
          const { error: itemsError } = await supabase.from('purchase_bill_items' as any).insert(newItems as any);
          if (itemsError) throw itemsError;
        }
      }

      return data as unknown as PurchaseBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_bills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Purchase bill updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const finalizeBill = useMutation({
    mutationFn: async (billId: string) => {
      const { data, error } = await supabase.rpc('finalize_purchase_bill', { p_bill_id: billId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_bills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_batches'] });
      toast({ title: 'Purchase bill finalized', description: 'Stock has been updated automatically.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_bills' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_bills'] });
      toast({ title: 'Purchase bill deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getBillWithItems = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('purchase_bills' as any)
      .select('*, items:purchase_bill_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as PurchaseBill;
  }, []);

  return {
    purchaseBills: billsQuery.data || [],
    isLoading: billsQuery.isLoading,
    createBill,
    updateBill,
    finalizeBill,
    deleteBill,
    getBillWithItems,
  };
}
