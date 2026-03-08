// Offline sync queue using native IndexedDB (no external dependency)
import { supabase } from '@/integrations/supabase/client';

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'inw_offline';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...value, id: key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDel(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbKeys(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
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
  await dbSet(`${QUEUE_PREFIX}${id}`, item);
  return id;
}

export async function getQueuedItems(): Promise<SyncQueueItem[]> {
  const allKeys = await dbKeys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX));
  const items: SyncQueueItem[] = [];
  for (const key of queueKeys) {
    const item = await dbGet<SyncQueueItem>(key);
    if (item) items.push(item);
  }
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeQueuedItem(id: string): Promise<void> {
  await dbDel(`${QUEUE_PREFIX}${id}`);
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
          await dbDel(`${QUEUE_PREFIX}${item.id}`);
          failed++;
        } else {
          await dbSet(`${QUEUE_PREFIX}${item.id}`, item);
          failed++;
        }
      } else {
        await dbDel(`${QUEUE_PREFIX}${item.id}`);
        synced++;
      }
    } catch {
      item.retries++;
      await dbSet(`${QUEUE_PREFIX}${item.id}`, item);
      failed++;
    }
  }

  return { synced, failed };
}

export async function getQueueCount(): Promise<number> {
  const allKeys = await dbKeys();
  return allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX)).length;
}
