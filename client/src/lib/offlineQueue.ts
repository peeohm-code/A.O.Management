/**
 * Offline Queue Management using IndexedDB
 * Stores form submissions when offline and syncs when connection is restored
 */

const DB_NAME = 'offline_queue_db';
const STORE_NAME = 'pending_requests';
const DB_VERSION = 1;

export interface QueueItem {
  id: string;
  type: 'comment' | 'progress' | 'inspection' | 'task' | 'defect';
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const queueItem: QueueItem = {
    ...item,
    id: `${item.type}_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(queueItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQueueItems(): Promise<QueueItem[]> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        const updatedItem = { ...item, ...updates };
        const putRequest = store.put(updatedItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Item not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearQueue(): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
