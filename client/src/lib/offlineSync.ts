/**
 * Offline Sync Manager
 * จัดการการ sync ข้อมูลอัตโนมัติเมื่อกลับมา online
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";
import {
  getQueueItems,
  removeFromQueue,
  updateQueueItem,
  QueueItem,
  getPhotoQueueItems,
  removePhotoFromQueue,
  updatePhotoQueueItem,
  PhotoQueueItem,
} from "./offlineQueue";

// สร้าง vanilla tRPC client สำหรับใช้นอก React component
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export class OfflineSyncManager {
  private isSyncing = false;
  private syncCallbacks: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // ฟังเหตุการณ์เมื่อกลับมา online
    window.addEventListener("online", () => {
      this.syncAll();
    });
  }

  /**
   * ลงทะเบียน callback สำหรับรับสถานะการ sync
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * แจ้งสถานะการ sync ไปยัง callbacks ทั้งหมด
   */
  private notifyStatus(status: SyncStatus) {
    this.syncCallbacks.forEach((callback) => callback(status));
  }

  /**
   * Sync ข้อมูลทั้งหมดที่รออยู่
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log("[OfflineSync] Already syncing, skipping...");
      return;
    }

    if (!navigator.onLine) {
      console.log("[OfflineSync] Still offline, skipping sync");
      return;
    }

    this.isSyncing = true;
    this.notifyStatus({ state: "syncing", progress: 0, total: 0 });

    try {
      const items = await getQueueItems();
      console.log(`[OfflineSync] Found ${items.length} items to sync`);

      if (items.length === 0) {
        this.notifyStatus({ state: "idle", progress: 0, total: 0 });
        this.isSyncing = false;
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const item of items) {
        try {
          await this.syncItem(item);
          await removeFromQueue(item.id);
          synced++;
          this.notifyStatus({
            state: "syncing",
            progress: synced + failed,
            total: items.length,
          });
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync item ${item.id}:`, error);
          failed++;

          // อัพเดท retry count
          await updateQueueItem(item.id, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : "Unknown error",
          });

          this.notifyStatus({
            state: "syncing",
            progress: synced + failed,
            total: items.length,
          });
        }
      }

      console.log(
        `[OfflineSync] Sync complete: ${synced} synced, ${failed} failed`
      );

      // Sync photos หลังจาก sync data เสร็จ
      await this.syncPhotos();

      this.notifyStatus({
        state: failed > 0 ? "error" : "success",
        progress: items.length,
        total: items.length,
        synced,
        failed,
      });

      // กลับไปสถานะ idle หลังจาก 3 วินาที
      setTimeout(() => {
        this.notifyStatus({ state: "idle", progress: 0, total: 0 });
      }, 3000);
    } catch (error) {
      console.error("[OfflineSync] Sync failed:", error);
      this.notifyStatus({ state: "error", progress: 0, total: 0 });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync item เดียว
   */
  private async syncItem(item: QueueItem) {
    console.log(`[OfflineSync] Syncing ${item.type}:`, item.id);

    switch (item.type) {
      case "comment":
        await this.syncComment(item.data);
        break;
      case "progress":
        await this.syncProgress(item.data);
        break;
      case "inspection":
        await this.syncInspection(item.data);
        break;
      case "task":
        await this.syncTask(item.data);
        break;
      case "defect":
        await this.syncDefect(item.data);
        break;
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  private async syncComment(data: any) {
    // ใช้ vanilla tRPC client
    await trpcClient.comment.add.mutate(data);
  }

  private async syncProgress(data: any) {
    // Progress update uses task.update with id and progress fields
    await trpcClient.task.update.mutate({
      id: data.taskId || data.id,
      progress: data.progress,
    });
  }

  private async syncInspection(data: any) {
    await trpcClient.checklist.submitInspection.mutate(data);
  }

  private async syncTask(data: any) {
    if (data.id) {
      await trpcClient.task.update.mutate(data);
    } else {
      await trpcClient.task.create.mutate(data);
    }
  }

  private async syncDefect(data: any) {
    await trpcClient.defect.create.mutate(data);
  }

  /**
   * Sync photos ที่รออยู่
   */
  async syncPhotos() {
    if (!navigator.onLine) {
      console.log('[OfflineSync] Still offline, skipping photo sync');
      return;
    }

    try {
      const photoItems = await getPhotoQueueItems();
      console.log(`[OfflineSync] Found ${photoItems.length} photos to sync`);

      if (photoItems.length === 0) {
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const item of photoItems) {
        try {
          await this.syncPhoto(item);
          await removePhotoFromQueue(item.id);
          synced++;
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync photo ${item.id}:`, error);
          failed++;

          await updatePhotoQueueItem(item.id, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(`[OfflineSync] Photo sync complete: ${synced} synced, ${failed} failed`);
    } catch (error) {
      console.error('[OfflineSync] Photo sync failed:', error);
    }
  }

  private async syncPhoto(item: PhotoQueueItem) {
    console.log(`[OfflineSync] Syncing photo:`, item.id);

    const formData = new FormData();
    formData.append('file', item.file);

    if (item.taskId) formData.append('taskId', item.taskId.toString());
    if (item.defectId) formData.append('defectId', item.defectId.toString());
    if (item.inspectionId) formData.append('inspectionId', item.inspectionId.toString());

    // Upload photo ผ่าน REST API
    const response = await fetch('/api/upload/photo', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Photo upload failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export interface SyncStatus {
  state: "idle" | "syncing" | "success" | "error";
  progress: number;
  total: number;
  synced?: number;
  failed?: number;
}

// Singleton instance
let syncManager: OfflineSyncManager | null = null;

export function getSyncManager() {
  if (!syncManager) {
    syncManager = new OfflineSyncManager();
  }
  return syncManager;
}
