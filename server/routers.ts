import { z } from "zod";
import { canEditDefect, canDeleteDefect } from "@shared/permissions";
import { TRPCError } from "@trpc/server";
import { boolToInt } from "./utils/typeHelpers.js";
import { COOKIE_NAME } from "@shared/const";
import {
  validateTaskCreateInput,
  validateTaskUpdateInput,
  validateInspectionSubmission,
  validateDefectCreateInput,
  validateDefectUpdateInput,
} from "@shared/validationUtils";
import { systemRouter } from "./_core/systemRouter";
import {
  protectedProcedure,
  publicProcedure,
  router,
  roleBasedProcedure,
} from "./_core/trpc";
import * as db from "./db";
import * as analyticsService from "./services/analytics.service";
import {
  generateProjectExport,
  generateProjectReport,
} from "./downloadProject";
import { generateArchiveExcel } from "./excelExport";
import { storagePut } from "./storage";
import {
  getTaskDisplayStatus,
  getTaskDisplayStatusLabel,
  getTaskDisplayStatusColor,
} from "./taskStatusHelper";
import { notifyOwner } from "./_core/notification";
import { checkArchiveWarnings } from "./archiveNotifications";
import { emitNotification } from "./_core/socket";
import { createNotification } from "./notificationService";
import {
  projectSchema,
  taskSchema,
  defectSchema,
  inspectionSchema,
} from "@shared/validations";
import { healthRouter } from "./monitoring/healthRouter";
import { optimizationRouter } from "./optimization/optimizationRouter";
import { cacheRouter } from "./cache/cacheRouter";
import { databaseRouter } from "./database/databaseRouter";
import { performanceRouter } from "./performance/performanceRouter";
import { getHealthStatus, formatBytes } from "./health";
import { exportRouter } from "./exportRouter";
import { monitoringRouter } from "./routers/monitoring";
import { teamRouter } from "./routers/teamRouter";
import { userManagementRouter } from "./routers/userManagementRouter";
import { roleTemplatesRouter } from "./routers/roleTemplatesRouter";
import { escalationRouter } from "./routers/escalationRouter";
import { logger } from "./logger";
import { getSessionCookieOptions } from "./_core/cookies";
import { getVapidPublicKey } from "./_core/pushNotification";

/**
 * Project Router - Project Management
 */

// Import feature-based routers
import { projectRouter } from "./routers/projectRouter";
import { taskRouter } from "./routers/taskRouter";
import { inspectionRouter } from "./routers/inspectionRouter";
import { checklistRouter } from "./routers/checklistRouter";
import { defectRouter } from "./routers/defectRouter";
import { commentRouter } from "./routers/commentRouter";
import { attachmentRouter } from "./routers/attachmentRouter";
import { notificationRouter } from "./routers/notificationRouter";
import { activityRouter } from "./routers/activityRouter";
import { dashboardRouter } from "./routers/dashboardRouter";
import { categoryColorRouter } from "./routers/categoryColorRouter";
import { inspectionStatsRouter } from "./routers/inspectionStatsRouter";
import { errorTrackingRouter } from "./routers/errorTrackingRouter";
import { performanceRouter as queryPerformanceRouter } from "./routers/performanceRouter";

/**
 * Main Application Router
 * Combines all feature-based routers
 */
export const appRouter = router({
  // Export Router
  export: exportRouter,

  // Team Management Router
  team: teamRouter,

  // User Management Enhancement Router
  userManagement: userManagementRouter,

  // Role Templates Router
  roleTemplates: roleTemplatesRouter,

  // Escalation Router
  escalation: escalationRouter,

  // Inspection Statistics Router
  inspectionStats: inspectionStatsRouter,

  // Error Tracking Router
  errorTracking: errorTrackingRouter,

  // Query Performance Monitoring Router
  queryPerformance: queryPerformanceRouter,

  // Dashboard Statistics Router (merged into dashboardRouter below)

  // Archive notifications check endpoint
  checkArchiveNotifications: protectedProcedure.mutation(async () => {
    const result = await checkArchiveWarnings();
    return result;
  }),

  // Advanced Analytics Router
  analytics: router({
    // Predictive Analytics
    predictive: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPredictiveAnalytics(input.projectId);
      }),

    // Cost Analysis
    costAnalysis: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCostAnalysis(input.projectId);
      }),

    // Resource Utilization
    resourceUtilization: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getResourceUtilization(input.projectId);
      }),

    // Quality Trend Analysis
    qualityTrend: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          days: z.number().optional().default(30),
        })
      )
      .query(async ({ input }) => {
        return await db.getQualityTrendAnalysis(input.projectId, input.days);
      }),

    // Risk Assessment
    riskAssessment: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskAssessment(input.projectId);
      }),

    // Performance KPIs
    performanceKPIs: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPerformanceKPIs(input.projectId);
      }),

    // Comparative Analysis
    comparative: protectedProcedure
      .input(z.object({ projectIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return await db.getComparativeAnalysis(input.projectIds);
      }),

    // Progress Chart Data
    progressChart: protectedProcedure
      .input(z.object({ projectIds: z.array(z.number()).optional() }))
      .query(async ({ input, ctx }) => {
        const projectId = input.projectIds && input.projectIds.length > 0 ? input.projectIds[0] : 0;
        // TODO: Implement getProgressChartData function in db.ts
        return { labels: [], datasets: [] };
      }),

    // Defect Trends Data
    defectTrends: protectedProcedure
      .input(
        z.object({
          projectId: z.number().optional(),
          days: z.enum(["7", "30", "90"]).optional().default("30"),
        })
      )
      .query(async ({ input, ctx }) => {
        // Calculate date range from days
        const days = parseInt(input.days || '30');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return await db.getDefectTrends({ 
          projectId: input.projectId, 
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          groupBy: 'day'
        });
      }),

    // Timeline Data
    timeline: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        // TODO: Implement getTimelineData function in db.ts
        return { events: [] };
      }),
  }),

  archiveRules: router({
    list: protectedProcedure.query(async () => {
      return await db.getArchiveRules();
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          projectStatus: z
            .enum(["planning", "active", "on_hold", "completed", "cancelled"])
            .optional(),
          daysAfterCompletion: z.number().optional(),
          daysAfterEndDate: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createArchiveRule({
          ...input,
          createdBy: ctx.user!.id,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          enabled: z.boolean().optional(),
          projectStatus: z
            .enum(["planning", "active", "on_hold", "completed", "cancelled"])
            .optional(),
          daysAfterCompletion: z.number().optional(),
          daysAfterEndDate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateArchiveRule(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteArchiveRule(input.id);
      }),
  }),

  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  user: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    create: roleBasedProcedure("users", "create")
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email format").optional(),
          role: z.enum(["admin", "project_manager", "qc_inspector", "worker"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // สร้าง mock openId สำหรับการทดสอบ
        const mockOpenId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await db.upsertUser({
          openId: mockOpenId,
          name: input.name,
          email: input.email || null,
          role: input.role,
          loginMethod: "manual_creation",
        });

        // ดึงข้อมูลผู้ใช้ที่สร้างใหม่
        const newUser = await db.getUserByOpenId(mockOpenId);
        if (!newUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        await db.logActivity({
          userId: ctx.user!.id,
          action: "create_user",
          details: `Created user: ${input.name} (${input.role})`,
        });

        return newUser;
      }),

    getStats: roleBasedProcedure("users", "view").query(async () => {
      const users = await db.getAllUsers();

      const stats = {
        total: users.length,
        byRole: {
          owner: users.filter((u) => u.role === "owner").length,
          admin: users.filter((u) => u.role === "admin").length,
          project_manager: users.filter((u) => u.role === "project_manager").length,
          qc_inspector: users.filter((u) => u.role === "qc_inspector").length,
          worker: users.filter((u) => u.role === "worker").length,
        },
        recentlyActive: users.filter((u) => {
          const lastSignIn = new Date(u.lastSignedIn);
          const daysSinceLastSignIn =
            (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastSignIn <= 7;
        }).length,
      };

      return stats;
    }),

    updateRole: roleBasedProcedure("users", "edit")
      .input(
        z.object({
          userId: z.number(),
          role: z.enum([
            "owner",
            "admin",
            "project_manager",
            "qc_inspector",
            "worker",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "user_role_updated",
          details: JSON.stringify({
            targetUserId: input.userId,
            newRole: input.role,
          }),
        });

        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserProfile(ctx.user!.id, input);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "profile_updated",
          details: JSON.stringify({ name: input.name, email: input.email }),
        });

        return { success: true };
      }),

    getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return {
        notificationDaysAdvance: user.notificationDaysAdvance,
        enableInAppNotifications: user.enableInAppNotifications,
        enableEmailNotifications: user.enableEmailNotifications,
        enableDailySummaryEmail: user.enableDailySummaryEmail,
        dailySummaryTime: user.dailySummaryTime,
      };
    }),

    updateNotificationSettings: protectedProcedure
      .input(
        z.object({
          notificationDaysAdvance: z.number().min(1).max(30).optional(),
          enableInAppNotifications: z.boolean().optional(),
          enableEmailNotifications: z.boolean().optional(),
          enableDailySummaryEmail: z.boolean().optional(),
          dailySummaryTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .optional(), // HH:mm format
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserNotificationSettings(ctx.user!.id, input);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "notification_settings_updated",
          details: JSON.stringify(input),
        });

        return { success: true };
      }),
  }),

  signature: router({
    create: protectedProcedure
      .input(
        z.object({
          checklistId: z.number(),
          signatureData: z.string(),
          signedBy: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const signature = await db.createSignature({
          checklistId: input.checklistId,
          signatureData: input.signatureData,
          signedBy: input.signedBy,
        });
        return signature;
      }),

    getByChecklist: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSignaturesByChecklistId(input.checklistId);
      }),
  }),

  dashboard: dashboardRouter,
  project: projectRouter,
  task: taskRouter,
  checklist: checklistRouter,
  templates: router({
    list: protectedProcedure.query(async () => {
      const templates = await db.getAllChecklistTemplates();
      const templateIds = templates.map((t: any) => t.id);
      const itemsMap = await db.getBatchChecklistTemplateItems(templateIds);
      
      return templates.map((template: any) => ({
        ...template,
        items: itemsMap.get(template.id) || [],
      }));
    }),
    
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          stage: z.enum(["pre", "in_progress", "post"]),
          items: z.array(
            z.object({
              description: z.string(),
              order: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Map stage to database enum
        const stageMap: Record<string, string> = {
          pre: "pre_execution",
          in_progress: "in_progress",
          post: "post_execution",
        };
        
        const templateResult = await db.createChecklistTemplate({
          name: input.name,
          description: input.description,
          stage: stageMap[input.stage] as "pre_execution" | "in_progress" | "post_execution",
          createdBy: ctx.user!.id,
        });
        
        const templateId = templateResult.insertId;
        
        // Add items
        for (const item of input.items) {
          await db.addChecklistTemplateItem({
            templateId,
            itemText: item.description,
            order: item.order,
          });
        }
        
        return { success: true, templateId };
      }),
  }),
  inspection: inspectionRouter,
  defect: defectRouter,
  comment: commentRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  activity: activityRouter,
  categoryColor: categoryColorRouter,
  monitoring: monitoringRouter,
  optimization: optimizationRouter,
  cache: cacheRouter,
  database: databaseRouter,
  performance: performanceRouter,

  // System Monitor for Admin
  systemMonitor: router({
    getMetrics: roleBasedProcedure("system", "view").query(async () => {
      const { getSystemMetrics } = await import("./monitoring/startMonitoring");
      return await getSystemMetrics();
    }),

    getDatabaseStats: roleBasedProcedure("system", "view").query(async () => {
      const { getDatabaseStats } = await import("./monitoring/startMonitoring");
      return await getDatabaseStats();
    }),

    applyIndexes: roleBasedProcedure("system", "edit").mutation(async () => {
      const { applyRecommendedIndexes } = await import(
        "./monitoring/startMonitoring"
      );
      return await applyRecommendedIndexes();
    }),
  }),

  // Health Check Endpoint (using existing healthRouter)
  health: healthRouter,

  // Push Notifications Router
  pushNotifications: router({
    // Subscribe to push notifications
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256Dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createPushSubscription({
          userId: ctx.user!.id,
          ...input,
        });
      }),

    // Unsubscribe from push notifications
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deletePushSubscriptionByEndpoint(input.endpoint);
      }),

    // Get user's subscriptions
    getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPushSubscriptionsByUserId(ctx.user!.id);
    }),

    // Get VAPID public key
    getVapidPublicKey: publicProcedure.query(() => {
      return { publicKey: getVapidPublicKey() };
    }),
  }),

  // Memory Monitoring Router
  memoryMonitoring: router({
    // บันทึก memory log
    createLog: protectedProcedure
      .input(
        z.object({
          totalMemoryMB: z.number(),
          usedMemoryMB: z.number(),
          freeMemoryMB: z.number(),
          usagePercentage: z.number(),
          buffersCacheMB: z.number().optional(),
          availableMemoryMB: z.number().optional(),
          swapTotalMB: z.number().optional(),
          swapUsedMB: z.number().optional(),
          swapFreePercentage: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createMemoryLog(input);
      }),

    // ดึงข้อมูล memory logs
    getLogs: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMemoryLogs(input);
      }),

    // ดึง memory statistics
    getStatistics: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMemoryStatistics(input);
      }),

    // บันทึก OOM event
    createOomEvent: protectedProcedure
      .input(
        z.object({
          processName: z.string().optional(),
          processId: z.number().optional(),
          killedProcessName: z.string().optional(),
          killedProcessId: z.number().optional(),
          memoryUsedMB: z.number().optional(),
          severity: z.enum(["low", "medium", "high", "critical"]).optional(),
          logMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOomEvent(input);
      }),

    // ดึงข้อมูล OOM events
    getOomEvents: protectedProcedure
      .input(
        z.object({
          resolved: z.boolean().optional(),
          severity: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getOomEvents(input);
      }),

    // แก้ไข OOM event
    resolveOomEvent: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          resolutionNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.resolveOomEvent(
          input.eventId,
          ctx.user!.id,
          input.resolutionNotes
        );
      }),

    // ดึง OOM event statistics
    getOomStatistics: protectedProcedure.query(async () => {
      return await db.getOomEventStatistics();
    }),
  }),

  // Alert Thresholds Router
  alertThresholds: router({
    // ดึงรายการ alert thresholds ของผู้ใช้
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAlertThresholds(ctx.user!.id);
    }),

    // สร้าง alert threshold ใหม่
    create: protectedProcedure
      .input(
        z.object({
          metricType: z.enum(["cpu", "memory"]),
          threshold: z.number().min(0).max(100),
          isEnabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createAlertThreshold({
          userId: ctx.user!.id,
          metricType: input.metricType,
          threshold: input.threshold,
          isEnabled: boolToInt(input.isEnabled),
        });
      }),

    // อัปเดต alert threshold
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          threshold: z.number().min(0).max(100).optional(),
          isEnabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAlertThreshold(id, data);
        return { success: true };
      }),

    // ลบ alert threshold
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAlertThreshold(input.id);
        return { success: true };
      }),

    // ตรวจสอบว่าค่าปัจจุบันเกิน threshold หรือไม่
    check: protectedProcedure
      .input(
        z.object({
          cpu: z.number(),
          memory: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.checkAlertThresholds(ctx.user!.id, input);
      }),
  }),
});


export type AppRouter = typeof appRouter;


