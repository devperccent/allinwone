import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { computeItemAmount } from '@/utils/invoiceUtils';

export interface PurchaseOrder {
  id: string;
  profile_id: string;
  supplier_name: string;
  supplier_gstin: string | null;
  supplier_address: string | null;
  po_number: string;
  date_issued: string;
  expected_delivery: string | null;
  status: string;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: POItem[];
}

export interface POItem {
  id: string;
  po_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
  amount: number;
  sort_order: number;
}

interface CreatePOData {
  supplier_name: string;
  supplier_gstin?: string | null;
  supplier_address?: string | null;
  date_issued: string;
  expected_delivery?: string | null;
  notes?: string | null;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  items: Omit<POItem, 'id' | 'po_id'>[];
}

const EMPTY_ARRAY: PurchaseOrder[] = [];

export function usePurchaseOrders() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const posQuery = useQuery({
    queryKey: ['purchase_orders', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`*, items:po_items(*)`)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
    enabled: !!profile?.id,
  });

  const createPO = useMutation({
    mutationFn: async (data: CreatePOData) => {
      if (!profile?.id) throw new Error('No profile');

      const nextNum = (profile as any).next_po_number || 1;
      const poNumber = `PO-${String(nextNum).padStart(4, '0')}`;

      const { data: po, error: pError } = await supabase
        .from('purchase_orders')
        .insert({
          profile_id: profile.id,
          supplier_name: data.supplier_name,
          supplier_gstin: data.supplier_gstin || null,
          supplier_address: data.supplier_address || null,
          po_number: poNumber,
          date_issued: data.date_issued,
          expected_delivery: data.expected_delivery || null,
          notes: data.notes || null,
          subtotal: data.subtotal,
          total_tax: data.total_tax,
          grand_total: data.grand_total,
          status: 'draft',
        })
        .select()
        .single();

      if (pError) throw pError;

      await supabase
        .from('profiles')
        .update({ next_po_number: nextNum + 1 })
        .eq('id', profile.id);

      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          po_id: po.id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          amount: item.amount || computeItemAmount(item as any),
          sort_order: index,
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(items);
        if (itemsError) throw itemsError;
      }

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'PO created', description: 'Purchase order saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePO = useMutation({
    mutationFn: async ({
      id,
      items,
      ...updates
    }: Partial<Omit<PurchaseOrder, 'items'>> & { id: string; items?: Omit<POItem, 'id' | 'po_id'>[] }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (items) {
        await supabase.from('po_items').delete().eq('po_id', id);

        const newItems = items.map((item, index) => ({
          po_id: id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          amount: item.amount || computeItemAmount(item as any),
          sort_order: index,
        }));

        if (newItems.length > 0) {
          const { error: itemsError } = await supabase.from('po_items').insert(newItems);
          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast({ title: 'PO updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePO = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast({ title: 'PO deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getPOWithItems = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`*, items:po_items(*)`)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'po_items', ascending: true })
      .single();

    if (error) throw error;
    return data as PurchaseOrder;
  }, []);

  const purchaseOrders = posQuery.data || EMPTY_ARRAY;

  return useMemo(() => ({
    purchaseOrders,
    isLoading: posQuery.isLoading,
    createPO,
    updatePO,
    deletePO,
    getPOWithItems,
  }), [purchaseOrders, posQuery.isLoading, createPO, updatePO, deletePO, getPOWithItems]);
}
