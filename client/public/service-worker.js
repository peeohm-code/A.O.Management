/**
 * Service Worker for Construction Management App
 * 
 * Features:
 * - Offline support with cache-first strategy for static assets
 * - Network-first strategy for API calls with offline fallback
 * - Background sync for QC inspection submissions
 * - Cache management and cleanup
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('static-') || 
                   cacheName.startsWith('dynamic-') || 
                   cacheName.startsWith('api-');
          })
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE && 
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE)
    );
    return;
  }

  // Static assets - cache first, network fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE)
    );
    return;
  }

  // HTML pages - network first, cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      networkFirstStrategy(request, DYNAMIC_CACHE)
    );
    return;
  }

  // Default - network only
  event.respondWith(fetch(request));
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[Service Worker] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Network-first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('[Service Worker] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.error('[Service Worker] No cache available:', error);
    
    // Return offline response for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'offline', 
          message: 'คุณกำลังออฟไลน์ ข้อมูลจะถูกซิงค์เมื่อกลับมาออนไลน์' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Background Sync - for QC inspection submissions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-qc-inspections') {
    event.waitUntil(syncQCInspections());
  }
});

// Sync QC inspections from IndexedDB
async function syncQCInspections() {
  try {
    console.log('[Service Worker] Syncing QC inspections...');
    
    // Get pending inspections from IndexedDB
    const db = await openDB();
    const pendingInspections = await getPendingInspections(db);
    
    if (pendingInspections.length === 0) {
      console.log('[Service Worker] No pending inspections to sync');
      return;
    }
    
    console.log(`[Service Worker] Found ${pendingInspections.length} pending inspections`);
    
    // Try to submit each inspection
    const results = await Promise.allSettled(
      pendingInspections.map(async (inspection) => {
        const response = await fetch('/api/trpc/qc.submitInspection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inspection.data),
        });
        
        if (response.ok) {
          // Remove from IndexedDB after successful submission
          await removeInspection(db, inspection.id);
          console.log('[Service Worker] Synced inspection:', inspection.id);
        } else {
          throw new Error(`Failed to sync inspection ${inspection.id}`);
        }
        
        return response;
      })
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[Service Worker] Synced ${successCount}/${pendingInspections.length} inspections`);
    
    // Notify user
    if (successCount > 0) {
      self.registration.showNotification('ซิงค์ข้อมูลสำเร็จ', {
        body: `ส่งผลการตรวจสอบ ${successCount} รายการสำเร็จ`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
      });
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error; // Retry later
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstructionManagementDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingInspections')) {
        db.createObjectStore('pendingInspections', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingInspections(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInspections'], 'readonly');
    const store = transaction.objectStore('pendingInspections');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeInspection(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInspections'], 'readwrite');
    const store = transaction.objectStore('pendingInspections');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message handler - for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(urls);
    });
  }
});
