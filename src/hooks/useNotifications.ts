import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast as sonnerToast } from 'sonner';

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationFilter = 'all' | 'unread' | 'info' | 'warning' | 'success' | 'error';

// Notification preferences stored in localStorage
export interface NotificationPreferences {
  lowStockAlerts: boolean;
  invoiceEvents: boolean;
  clientEvents: boolean;
  toastPopups: boolean;
}

const PREFS_KEY = 'inw-notification-prefs';

const defaultPrefs: NotificationPreferences = {
  lowStockAlerts: true,
  invoiceEvents: true,
  clientEvents: true,
  toastPopups: true,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...defaultPrefs, ...JSON.parse(stored) };
  } catch {}
  return defaultPrefs;
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

const typeToastStyles: Record<string, { icon: string }> = {
  info: { icon: 'ℹ️' },
  warning: { icon: '⚠️' },
  success: { icon: '✅' },
  error: { icon: '❌' },
};

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile?.id,
  });

  // Realtime subscription with toast popup
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profile.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] });

          // Show toast popup if enabled
          const prefs = getNotificationPreferences();
          if (prefs.toastPopups && payload.new) {
            const n = payload.new as Notification;
            const style = typeToastStyles[n.type] || typeToastStyles.info;
            sonnerToast(n.title, {
              description: n.message,
              icon: style.icon,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', profile.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('profile_id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getFiltered = useCallback(
    (filter: NotificationFilter) => {
      if (filter === 'all') return notifications;
      if (filter === 'unread') return notifications.filter((n) => !n.is_read);
      return notifications.filter((n) => n.type === filter);
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getFiltered,
  };
}
