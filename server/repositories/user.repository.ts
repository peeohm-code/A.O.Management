import { eq } from "drizzle-orm";
import { users, InsertUser } from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { ENV } from "../_core/env";

/**
 * User Repository
 * 
 * Handles all user-related database operations
 */
export class UserRepository extends BaseRepository {
  /**
   * Upsert user (insert or update on duplicate key)
   */
  async upsertUser(user: InsertUser): Promise<void> {
    if (!user.openId) {
      throw new Error("User openId is required for upsert");
    }

    if (!this.db) {
      this.warnDatabaseUnavailable("upsert user");
      return;
    }

    try {
      const values: InsertUser = {
        openId: user.openId,
      };
      const updateSet: Record<string, unknown> = {};

      const textFields = ["name", "email", "loginMethod"] as const;
      type TextField = (typeof textFields)[number];

      const assignNullable = (field: TextField) => {
        const value = user[field];
        if (value === undefined) return;
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      };

      textFields.forEach(assignNullable);

      if (user.lastSignedIn !== undefined) {
        values.lastSignedIn = user.lastSignedIn;
        updateSet.lastSignedIn = user.lastSignedIn;
      }
      if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = 'admin';
        updateSet.role = 'admin';
      }

      if (!values.lastSignedIn) {
        values.lastSignedIn = new Date();
      }

      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
      }

      await this.db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } catch (error) {
      console.error("[UserRepository] Failed to upsert user:", error);
      throw error;
    }
  }

  /**
   * Get user by OpenID
   */
  async getUserByOpenId(openId: string) {
    if (!this.db) {
      this.warnDatabaseUnavailable("get user");
      return undefined;
    }

    const result = await this.db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number) {
    if (!this.db) {
      this.warnDatabaseUnavailable("get user");
      return undefined;
    }

    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    if (!this.db) {
      this.warnDatabaseUnavailable("get all users");
      return [];
    }

    return await this.db.select().from(users);
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: number, role: "owner" | "admin" | "project_manager" | "qc_inspector" | "worker") {
    if (!this.db) {
      this.warnDatabaseUnavailable("update user role");
      return;
    }

    await this.db.update(users).set({ role }).where(eq(users.id, userId));
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: number, data: { name: string; email?: string }) {
    if (!this.db) {
      this.warnDatabaseUnavailable("update user profile");
      return;
    }

    await this.db.update(users).set({
      name: data.name,
      email: data.email,
    }).where(eq(users.id, userId));
  }

  /**
   * Update user notification settings
   */
  async updateUserNotificationSettings(
    userId: number,
    settings: {
      enableInAppNotifications?: boolean;
      enableEmailNotifications?: boolean;
      enableDailySummaryEmail?: boolean;
      dailySummaryTime?: string;
      notificationDaysAdvance?: number;
    }
  ) {
    if (!this.db) {
      this.warnDatabaseUnavailable("update notification settings");
      return;
    }

    const updateData: any = {};
    if (settings.enableInAppNotifications !== undefined) {
      updateData.enableInAppNotifications = settings.enableInAppNotifications ? 1 : 0;
    }
    if (settings.enableEmailNotifications !== undefined) {
      updateData.enableEmailNotifications = settings.enableEmailNotifications ? 1 : 0;
    }
    if (settings.enableDailySummaryEmail !== undefined) {
      updateData.enableDailySummaryEmail = settings.enableDailySummaryEmail ? 1 : 0;
    }
    if (settings.dailySummaryTime !== undefined) {
      updateData.dailySummaryTime = settings.dailySummaryTime;
    }
    if (settings.notificationDaysAdvance !== undefined) {
      updateData.notificationDaysAdvance = settings.notificationDaysAdvance;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.update(users).set(updateData).where(eq(users.id, userId));
    }
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(usersData: Array<{
    openId: string;
    name: string;
    email?: string;
    role?: "owner" | "admin" | "project_manager" | "qc_inspector" | "worker";
  }>) {
    if (!this.db) {
      this.warnDatabaseUnavailable("bulk create users");
      return { success: 0, failed: 0, errors: [] };
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ openId: string; error: string }>,
    };

    for (const userData of usersData) {
      try {
        await this.upsertUser({
          openId: userData.openId,
          name: userData.name,
          email: userData.email,
          role: userData.role || "worker",
        });
        results.success++;
      } catch (error: unknown) {
        results.failed++;
        results.errors.push({
          openId: userData.openId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
}
