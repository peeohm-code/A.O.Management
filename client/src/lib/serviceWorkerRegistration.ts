/**
 * Service Worker Registration Utility
 * 
 * Handles registration, updates, and communication with the service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';

      registerValidSW(swUrl, config);
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service Worker registered:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[SW] New content is available; please refresh.');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content cached for offline use
              console.log('[SW] Content is cached for offline use.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Setup online/offline listeners
      window.addEventListener('online', () => {
        console.log('[SW] Back online');
        if (config && config.onOnline) {
          config.onOnline();
        }
        // Trigger background sync
        registration.sync.register('sync-qc-inspections').catch((err) => {
          console.error('[SW] Background sync registration failed:', err);
        });
      });

      window.addEventListener('offline', () => {
        console.log('[SW] Gone offline');
        if (config && config.onOffline) {
          config.onOffline();
        }
      });
    })
    .catch((error) => {
      console.error('[SW] Service Worker registration failed:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Service Worker unregistration failed:', error);
      });
  }
}

/**
 * Save QC inspection to IndexedDB for background sync
 */
export async function saveInspectionForSync(inspectionData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstructionManagementDB', 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingInspections'], 'readwrite');
      const store = transaction.objectStore('pendingInspections');
      
      const addRequest = store.add({
        data: inspectionData,
        timestamp: Date.now(),
      });

      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => {
        console.log('[SW] Inspection saved for background sync');
        resolve();
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('pendingInspections')) {
        db.createObjectStore('pendingInspections', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
}

/**
 * Request background sync for pending inspections
 */
export async function requestSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-qc-inspections');
      console.log('[SW] Background sync requested');
    } catch (error) {
      console.error('[SW] Background sync request failed:', error);
      throw error;
    }
  } else {
    throw new Error('Background sync not supported');
  }
}

/**
 * Check if app is currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Get pending inspections count from IndexedDB
 */
export async function getPendingInspectionsCount(): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstructionManagementDB', 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('pendingInspections')) {
        resolve(0);
        return;
      }

      const transaction = db.transaction(['pendingInspections'], 'readonly');
      const store = transaction.objectStore('pendingInspections');
      const countRequest = store.count();

      countRequest.onerror = () => reject(countRequest.error);
      countRequest.onsuccess = () => resolve(countRequest.result);
    };
  });
}
