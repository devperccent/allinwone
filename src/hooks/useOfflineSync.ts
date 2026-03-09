import { useState, useEffect, useCallback, useRef } from 'react';
import { syncQueue, getQueueCount } from '@/lib/offlineSync';
import { useToast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const syncingRef = useRef(false);

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Poll queue count — every 30s is sufficient
  useEffect(() => {
    const check = async () => {
      const count = await getQueueCount();
      setPendingCount(count);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      doSync();
    }
  }, [isOnline, pendingCount]);

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const result = await syncQueue();
      const newCount = await getQueueCount();
      setPendingCount(newCount);

      if (result.synced > 0) {
        toast({
          title: 'Synced!',
          description: `${result.synced} offline change${result.synced !== 1 ? 's' : ''} synced successfully.`,
        });
      }
      if (result.failed > 0) {
        toast({
          title: 'Sync issues',
          description: `${result.failed} change${result.failed !== 1 ? 's' : ''} failed to sync. Will retry.`,
          variant: 'destructive',
        });
      }
    } catch {
      // Silent fail
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [toast]);

  return { isOnline, pendingCount, isSyncing, doSync };
}
