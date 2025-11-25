import { z } from "zod";
import { router, protectedProcedure, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Role Templates Router - Manage permission templates for roles
 */
export const roleTemplatesRouter = router({
  // Get all role templates
  list: protectedProcedure.query(async () => {
    return await db.getAllRoleTemplates();
  }),

  // Get role templates by type
  listByType: protectedProcedure
    .input(
      z.object({
        roleType: z.enum(["project_manager", "qc_inspector", "worker"]),
      })
    )
    .query(async ({ input }) => {
      return await db.getRoleTemplatesByType(input.roleType);
    }),

  // Get default template for a role type
  getDefault: protectedProcedure
    .input(
      z.object({
        roleType: z.enum(["project_manager", "qc_inspector", "worker"]),
      })
    )
    .query(async ({ input }) => {
      return await db.getDefaultRoleTemplate(input.roleType);
    }),

  // Get template by ID with permissions
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await db.getRoleTemplateById(input.id);
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const permissions = await db.getRoleTemplatePermissions(input.id);
      return {
        ...template,
        permissions,
      };
    }),

  // Create new role template (admin only)
  create: roleBasedProcedure("users", "create")
    .input(
      z.object({
        name: z.string().min(1).max(100),
        roleType: z.enum(["project_manager", "qc_inspector", "worker"]),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        permissionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const templateId = await db.createRoleTemplate({
        ...input,
        createdBy: ctx.user!.id,
      });

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "create_role_template",
        module: "users",
        entityType: "role_template",
        entityId: templateId,
        details: {
          templateName: input.name,
          roleType: input.roleType,
          permissionCount: input.permissionIds.length,
        },
      });

      return { id: templateId };
    }),

  // Update role template (admin only)
  update: roleBasedProcedure("users", "edit")
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        permissionIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      await db.updateRoleTemplate(id, data);

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "update_role_template",
        module: "users",
        entityType: "role_template",
        entityId: id,
        details: {
          updates: Object.keys(data),
        },
      });

      return { success: true };
    }),

  // Delete role template (admin only)
  delete: roleBasedProcedure("users", "delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteRoleTemplate(input.id);

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "delete_role_template",
        module: "users",
        entityType: "role_template",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Apply template to user (admin only)
  applyToUser: roleBasedProcedure("users", "edit")
    .input(
      z.object({
        userId: z.number(),
        templateId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.applyRoleTemplateToUser({
        userId: input.userId,
        templateId: input.templateId,
        grantedBy: ctx.user!.id,
      });

      // Get template info for logging
      const template = await db.getRoleTemplateById(input.templateId);

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "apply_role_template",
        module: "users",
        entityType: "user",
        entityId: input.userId,
        details: {
          templateId: input.templateId,
          templateName: template?.name,
        },
      });

      return { success: true };
    }),

  // Get template permissions
  getPermissions: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      return await db.getRoleTemplatePermissions(input.templateId);
    }),
});
