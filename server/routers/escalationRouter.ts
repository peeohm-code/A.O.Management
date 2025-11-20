import { z } from "zod";
import { router, protectedProcedure, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Escalation Router - จัดการระบบ escalation
 */
export const escalationRouter = router({
  // ดึงกฎการ escalate ทั้งหมด
  listRules: roleBasedProcedure("escalation", "view").query(async () => {
    return await db.getAllEscalationRules();
  }),

  // ดึงกฎการ escalate ตาม ID
  getRuleById: roleBasedProcedure("escalation", "view")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rule = await db.getEscalationRuleById(input.id);
      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Escalation rule not found",
        });
      }
      return rule;
    }),

  // สร้างกฎการ escalate ใหม่
  createRule: roleBasedProcedure("escalation", "create")
    .input(
      z.object({
        name: z.string().min(1, "ชื่อกฎต้องไม่ว่าง"),
        description: z.string().optional(),
        enabled: z.boolean().optional().default(true),
        triggerType: z.enum(["defect", "inspection_failed", "task_overdue"]),
        severityLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
        hoursUntilEscalation: z.number().min(1, "ต้องมากกว่า 0 ชั่วโมง"),
        escalateToRoles: z.array(z.string()).optional(),
        escalateToUserIds: z.array(z.number()).optional(),
        notificationChannels: z.array(z.string()).optional(),
        notificationTemplate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.createEscalationRule({
        ...input,
        createdBy: ctx.user!.id,
      });

      await db.logActivity({
        userId: ctx.user!.id,
        action: "escalation_rule_created",
        details: JSON.stringify({ ruleName: input.name }),
      });

      return result;
    }),

  // อัปเดตกฎการ escalate
  updateRule: roleBasedProcedure("escalation", "edit")
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        triggerType: z.enum(["defect", "inspection_failed", "task_overdue"]).optional(),
        severityLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
        hoursUntilEscalation: z.number().min(1).optional(),
        escalateToRoles: z.array(z.string()).optional(),
        escalateToUserIds: z.array(z.number()).optional(),
        notificationChannels: z.array(z.string()).optional(),
        notificationTemplate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateEscalationRule(id, data);

      await db.logActivity({
        userId: ctx.user!.id,
        action: "escalation_rule_updated",
        details: JSON.stringify({ ruleId: id }),
      });

      return { success: true };
    }),

  // ลบกฎการ escalate
  deleteRule: roleBasedProcedure("escalation", "delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteEscalationRule(input.id);

      await db.logActivity({
        userId: ctx.user!.id,
        action: "escalation_rule_deleted",
        details: JSON.stringify({ ruleId: input.id }),
      });

      return { success: true };
    }),

  // ดึง escalation logs ทั้งหมด
  listLogs: roleBasedProcedure("escalation", "view")
    .input(
      z.object({
        resolved: z.boolean().optional(),
        entityType: z.enum(["defect", "inspection", "task"]).optional(),
        projectId: z.number().optional(),
        limit: z.number().optional().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      return await db.getAllEscalationLogs(input);
    }),

  // ดึง escalation logs ตาม entity
  getLogsByEntity: roleBasedProcedure("escalation", "view")
    .input(
      z.object({
        entityType: z.enum(["defect", "inspection", "task"]),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await db.getEscalationLogsByEntity(input.entityType, input.entityId);
    }),

  // แก้ไข escalation log (mark as resolved)
  resolveLog: roleBasedProcedure("escalation", "edit")
    .input(
      z.object({
        id: z.number(),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.resolveEscalationLog(input.id, ctx.user!.id, input.resolutionNotes);

      await db.logActivity({
        userId: ctx.user!.id,
        action: "escalation_resolved",
        details: JSON.stringify({ logId: input.id }),
      });

      return { success: true };
    }),

  // ดึงสถิติ escalation
  getStatistics: roleBasedProcedure("escalation", "view")
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        projectId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await db.getEscalationStatistics(input);
    }),

  // ทริกเกอร์การตรวจสอบ escalation ด้วยตนเอง (สำหรับทดสอบ)
  triggerCheck: roleBasedProcedure("escalation", "edit")
    .mutation(async ({ ctx }) => {
      await db.checkAndTriggerEscalations();

      await db.logActivity({
        userId: ctx.user!.id,
        action: "escalation_check_triggered",
        details: "Manual escalation check triggered",
      });

      return { success: true, message: "Escalation check completed" };
    }),
});
