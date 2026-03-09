import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityLog {
  id: string;
  profile_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const EMPTY_ARRAY: ActivityLog[] = [];

export function useActivityLogs(limit = 15) {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ['activity_logs', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000, // 2 min stale time — activity logs don't need instant refresh
  });

  return useMemo(() => ({
    data: query.data || EMPTY_ARRAY,
    isLoading: query.isLoading,
    error: query.error,
  }), [query.data, query.isLoading, query.error]);
}
