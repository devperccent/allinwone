import { useQuery } from '@tanstack/react-query';
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

export function useInventoryLogs(productId?: string) {
  const { profile } = useAuth();

  const logsQuery = useQuery({
    queryKey: ['inventory_logs', productId],
    queryFn: async () => {
      if (!productId) return [];

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
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
  };
}
