import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProductBatch {
  id: string;
  product_id: string;
  profile_id: string;
  batch_number: string;
  expiry_date: string | null;
  quantity: number;
  purchase_bill_id: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_ARRAY: ProductBatch[] = [];

export function useProductBatches(productId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const batchesQuery = useQuery({
    queryKey: ['product_batches', profile?.id, productId],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      let query = supabase
        .from('product_batches' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProductBatch[];
    },
    enabled: !!profile?.id,
  });

  const allBatchesQuery = useQuery({
    queryKey: ['product_batches_all', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      const { data, error } = await supabase
        .from('product_batches' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as unknown as ProductBatch[];
    },
    enabled: !!profile?.id && !productId,
  });

  const batches = batchesQuery.data || EMPTY_ARRAY;
  const allBatches = allBatchesQuery.data || batches;
  const alertDays = (profile as any)?.expiry_alert_days || 30;

  // Memoize expiring & expired computations — single pass
  const { expiringBatches, expiredBatches } = useMemo(() => {
    const now = Date.now();
    const alertMs = alertDays * 86400000;
    const expiring: ProductBatch[] = [];
    const expired: ProductBatch[] = [];

    for (const b of allBatches) {
      if (!b.expiry_date) continue;
      const expiryTime = new Date(b.expiry_date).getTime();
      if (expiryTime <= now) {
        expired.push(b);
      } else if (expiryTime - now <= alertMs) {
        expiring.push(b);
      }
    }
    return { expiringBatches: expiring, expiredBatches: expired };
  }, [allBatches, alertDays]);

  const createBatch = useMutation({
    mutationFn: async (batch: { product_id: string; batch_number: string; expiry_date?: string; quantity: number }) => {
      if (!profile?.id) throw new Error('No profile');
      const { data, error } = await supabase
        .from('product_batches' as any)
        .insert({
          ...batch,
          profile_id: profile.id,
          expiry_date: batch.expiry_date || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProductBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_batches'] });
      toast({ title: 'Batch created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return useMemo(() => ({
    batches,
    expiringBatches,
    expiredBatches,
    isLoading: batchesQuery.isLoading,
    createBatch,
  }), [batches, expiringBatches, expiredBatches, batchesQuery.isLoading, createBatch]);
}
