import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryChallan {
  id: string;
  profile_id: string;
  client_id: string | null;
  challan_number: string;
  date_issued: string;
  invoice_id: string | null;
  transport_mode: string | null;
  vehicle_number: string | null;
  dispatch_from: string | null;
  dispatch_to: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
  } | null;
  items?: ChallanItem[];
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  sort_order: number;
}

interface CreateChallanData {
  client_id?: string | null;
  date_issued: string;
  invoice_id?: string | null;
  transport_mode?: string | null;
  vehicle_number?: string | null;
  dispatch_from?: string | null;
  dispatch_to?: string | null;
  notes?: string | null;
  items: Omit<ChallanItem, 'id' | 'challan_id'>[];
}

export function useDeliveryChallans() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const challansQuery = useQuery({
    queryKey: ['delivery_challans', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('delivery_challans')
        .select(`*, client:clients(id, name), items:challan_items(*)`)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeliveryChallan[];
    },
    enabled: !!profile?.id,
  });

  const createChallan = useMutation({
    mutationFn: async (data: CreateChallanData) => {
      if (!profile?.id) throw new Error('No profile');

      // Generate challan number
      const nextNum = (profile as any).next_challan_number || 1;
      const challanNumber = `DC-${String(nextNum).padStart(4, '0')}`;

      const { data: challan, error: cError } = await supabase
        .from('delivery_challans')
        .insert({
          profile_id: profile.id,
          client_id: data.client_id || null,
          challan_number: challanNumber,
          date_issued: data.date_issued,
          invoice_id: data.invoice_id || null,
          transport_mode: data.transport_mode || null,
          vehicle_number: data.vehicle_number || null,
          dispatch_from: data.dispatch_from || null,
          dispatch_to: data.dispatch_to || null,
          notes: data.notes || null,
          status: 'draft',
        })
        .select()
        .single();

      if (cError) throw cError;

      // Increment challan number
      await supabase
        .from('profiles')
        .update({ next_challan_number: nextNum + 1 })
        .eq('id', profile.id);

      // Create items
      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          challan_id: challan.id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase.from('challan_items').insert(items);
        if (itemsError) throw itemsError;
      }

      return challan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_challans'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Challan created', description: 'Delivery challan saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateChallan = useMutation({
    mutationFn: async ({
      id,
      items,
      ...updates
    }: Partial<DeliveryChallan> & { id: string; items?: Omit<ChallanItem, 'id' | 'challan_id'>[] }) => {
      const { data, error } = await supabase
        .from('delivery_challans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (items) {
        await supabase.from('challan_items').delete().eq('challan_id', id);

        const newItems = items.map((item, index) => ({
          challan_id: id,
          product_id: item.product_id || null,
          description: item.description,
          qty: item.qty,
          sort_order: index,
        }));

        if (newItems.length > 0) {
          const { error: itemsError } = await supabase.from('challan_items').insert(newItems);
          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_challans'] });
      toast({ title: 'Challan updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChallan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_challans'] });
      toast({ title: 'Challan deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getChallanWithItems = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('delivery_challans')
      .select(`*, client:clients(*), items:challan_items(*)`)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'challan_items', ascending: true })
      .single();

    if (error) throw error;
    return data as DeliveryChallan;
  }, []);

  return {
    challans: challansQuery.data || [],
    isLoading: challansQuery.isLoading,
    createChallan,
    updateChallan,
    deleteChallan,
    getChallanWithItems,
  };
}
