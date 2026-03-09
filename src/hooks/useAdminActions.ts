import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, suspend, reason }: { profileId: string; suspend: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend, suspended_reason: suspend ? (reason || 'Suspended by admin') : null } as any)
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_detail'] });
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ['active_announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, message, type, profileId, expiresAt }: { title: string; message: string; type: string; profileId: string; expiresAt?: string }) => {
      const { error } = await supabase
        .from('announcements' as any)
        .insert({ title, message, type, created_by: profileId, expires_at: expiresAt || null } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active_announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active_announcements'] });
    },
  });
}
