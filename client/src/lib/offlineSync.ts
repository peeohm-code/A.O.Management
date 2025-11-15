/**
 * Offline Sync Manager
 * จัดการการ sync ข้อมูลอัตโนมัติเมื่อกลับมา online
 */

import { trpc } from "./trpc";
import {
  getQueueItems,
  removeFromQueue,
  updateQueueItem,
  QueueItem,
} from "./offlineQueue";

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
    // ใช้ trpc client แบบ vanilla (ไม่ใช่ hooks)
    const client = trpc.useUtils().client;
    await client.comment.create.mutate(data);
  }

  private async syncProgress(data: any) {
    const client = trpc.useUtils().client;
    await client.task.updateProgress.mutate(data);
  }

  private async syncInspection(data: any) {
    const client = trpc.useUtils().client;
    await client.qc.submitInspection.mutate(data);
  }

  private async syncTask(data: any) {
    const client = trpc.useUtils().client;
    if (data.id) {
      await client.task.update.mutate(data);
    } else {
      await client.task.create.mutate(data);
    }
  }

  private async syncDefect(data: any) {
    const client = trpc.useUtils().client;
    await client.defect.create.mutate(data);
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
