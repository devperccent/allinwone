// Offline sync queue using IndexedDB via idb-keyval
import { get, set, del, keys } from 'idb-keyval';
import { supabase } from '@/integrations/supabase/client';

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
  retries: number;
}

const QUEUE_PREFIX = 'sync_queue_';

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueueOfflineMutation(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, any>
): Promise<string> {
  const id = generateId();
  const item: SyncQueueItem = {
    id,
    table,
    operation,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  await set(`${QUEUE_PREFIX}${id}`, item);
  return id;
}

export async function getQueuedItems(): Promise<SyncQueueItem[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX));
  const items: SyncQueueItem[] = [];
  for (const key of queueKeys) {
    const item = await get(key);
    if (item) items.push(item as SyncQueueItem);
  }
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeQueuedItem(id: string): Promise<void> {
  await del(`${QUEUE_PREFIX}${id}`);
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getQueuedItems();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      let error: any = null;

      if (item.operation === 'insert') {
        const { error: e } = await supabase.from(item.table as any).insert(item.data as any);
        error = e;
      } else if (item.operation === 'update') {
        const { id: rowId, ...updates } = item.data;
        const { error: e } = await supabase.from(item.table as any).update(updates as any).eq('id', rowId);
        error = e;
      } else if (item.operation === 'delete') {
        const { error: e } = await supabase.from(item.table as any).delete().eq('id', item.data.id);
        error = e;
      }

      if (error) {
        item.retries++;
        if (item.retries >= 3) {
          // Give up after 3 retries
          await removeQueuedItem(item.id);
          failed++;
        } else {
          await set(`${QUEUE_PREFIX}${item.id}`, item);
          failed++;
        }
      } else {
        await removeQueuedItem(item.id);
        synced++;
      }
    } catch {
      item.retries++;
      await set(`${QUEUE_PREFIX}${item.id}`, item);
      failed++;
    }
  }

  return { synced, failed };
}

export async function getQueueCount(): Promise<number> {
  const allKeys = await keys();
  return allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX)).length;
}
