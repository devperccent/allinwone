import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InventoryLog {
  id: string;
  product_id: string;
  change_amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

const EMPTY_ARRAY: InventoryLog[] = [];

export function useInventoryLogs(productId?: string) {
  const { profile } = useAuth();

  const logsQuery = useQuery({
    queryKey: ['inventory_logs', productId],
    queryFn: async () => {
      if (!productId) return EMPTY_ARRAY;

      const { data, error } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as InventoryLog[];
    },
    enabled: !!profile?.id && !!productId,
    staleTime: 5 * 60 * 1000, // 5 min — inventory logs are append-only
  });

  return useMemo(() => ({
    logs: logsQuery.data || EMPTY_ARRAY,
    isLoading: logsQuery.isLoading,
  }), [logsQuery.data, logsQuery.isLoading]);
}
