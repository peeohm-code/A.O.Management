const CACHE_NAME = 'conqc-v1';
const STATIC_CACHE = 'conqc-static-v1';
const DYNAMIC_CACHE = 'conqc-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets - cache first
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML pages - network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match('/index.html');
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ConQC', body: event.data.text() };
    }
  }

  const title = data.title || 'ConQC';
  const options = {
    body: data.body || 'คุณมีการแจ้งเตือนใหม่',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (for offline data sync)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when back online
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB
    const db = await openDB();
    const offlineData = await getOfflineData(db);
    
    if (offlineData.length === 0) {
      console.log('[Service Worker] No offline data to sync');
      return;
    }
    
    console.log('[Service Worker] Syncing offline data:', offlineData.length, 'items');
    
    // Send data to server
    for (const item of offlineData) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData(db, item.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync item:', error);
      }
    }
    
    console.log('[Service Worker] Offline data sync complete');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getOfflineData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeOfflineData(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
