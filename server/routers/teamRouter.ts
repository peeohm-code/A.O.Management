import { z } from "zod";
import { router, protectedProcedure, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { createNotification } from "../notificationService";

/**
 * Team Management Router
 * Handles team member management, role assignments, and team-related operations
 */
export const teamRouter = router({
  /**
   * Get all users in the system (Admin only)
   */
  listAllUsers: roleBasedProcedure('users', 'viewAll')
    .query(async () => {
      return await db.getAllUsers();
    }),

  /**
   * Alias for listAllUsers (for backward compatibility)
   */
  getAllUsers: roleBasedProcedure('users', 'viewAll')
    .query(async () => {
      return await db.getAllUsers();
    }),

  /**
   * Get team members for a specific project
   */
  getProjectMembers: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getProjectMembers(input.projectId);
    }),

  /**
   * Add a team member to a project
   */
  addProjectMember: roleBasedProcedure('users', 'changeRole')
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["project_manager", "qc_inspector", "worker"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if member already exists
      const existingMembers = await db.getProjectMembers(input.projectId);
      const alreadyMember = existingMembers.some((m: any) => m.userId === input.userId);
      
      if (alreadyMember) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ผู้ใช้นี้เป็นสมาชิกของโครงการอยู่แล้ว',
        });
      }

      const result = await db.addProjectMember(input);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "team_member_added",
        details: JSON.stringify({ userId: input.userId, role: input.role }),
      });

      // Send notification to the new member
      const project = await db.getProjectById(input.projectId);
      if (project) {
        await createNotification({
          userId: input.userId,
          type: "project_member_added",
          title: "เพิ่มเข้าทีมโครงการ",
          content: `คุณได้ถูกเพิ่มเข้าทีมโครงการ "${project.name}" ในบทบาท ${input.role}`,
          relatedProjectId: input.projectId,
        });
      }

      return result;
    }),

  /**
   * Remove a team member from a project
   */
  removeProjectMember: roleBasedProcedure('users', 'changeRole')
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.removeProjectMember(input.projectId, input.userId);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "team_member_removed",
        details: JSON.stringify({ userId: input.userId }),
      });

      return result;
    }),

  /**
   * Update team member's role in a project
   */
  updateMemberRole: roleBasedProcedure('users', 'changeRole')
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["project_manager", "qc_inspector", "worker"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.updateProjectMemberRole(input.projectId, input.userId, input.role);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "team_member_role_updated",
        details: JSON.stringify({ userId: input.userId, newRole: input.role }),
      });

      // Send notification to the member
      const project = await db.getProjectById(input.projectId);
      if (project) {
      await createNotification({
        userId: input.userId,
        type: "project_member_added",
        title: "บทบาทในทีมเปลี่ยนแปลง",
        content: `บทบาทของคุณในโครงการ "${project.name}" ถูกเปลี่ยนเป็น ${input.role}`,
        relatedProjectId: input.projectId,
      });
      }

      return result;
    }),

  /**
   * Update user's global role (Admin/Owner only)
   */
  updateUserRole: roleBasedProcedure('users', 'changeRole')
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "project_manager", "qc_inspector", "worker"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only owner can change roles to admin
      if (input.role === 'admin' && ctx.user!.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'เฉพาะ Owner เท่านั้นที่สามารถกำหนดบทบาท Admin ได้',
        });
      }

      const result = await db.updateUserRole(input.userId, input.role);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        action: "user_role_updated",
        details: JSON.stringify({ targetUserId: input.userId, newRole: input.role }),
      });

      // Send notification to the user
      await createNotification({
        userId: input.userId,
        type: "system_health_info",
        title: "บทบาทของคุณเปลี่ยนแปลง",
        content: `บทบาทของคุณในระบบถูกเปลี่ยนเป็น ${input.role}`,
      });

      return result;
    }),

  /**
   * Get my tasks across all projects
   */
  getMyTasks: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", "todo", "in_progress", "completed"]).optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await db.getUserTasks(ctx.user!.id, input.status, input.limit);
    }),

  /**
   * Get team activity feed for a project
   */
  getTeamActivity: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      return await db.getProjectActivity(input.projectId, input.limit);
    }),

  /**
   * Get team member profile
   */
  getMemberProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ไม่พบผู้ใช้',
        });
      }

      // Get user's projects
      const projects = await db.getUserProjects(input.userId);

      // Get user's task statistics
      const taskStats = await db.getUserTaskStats(input.userId);

      return {
        user,
        projects,
        taskStats,
      };
    }),

  /**
   * Get team dashboard statistics
   */
  getTeamStats: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const members = await db.getProjectMembers(input.projectId);
      
      const memberStats = await Promise.all(
        members.map(async (member: any) => {
          const taskStats = await db.getUserTaskStatsForProject(member.userId, input.projectId);
          return {
            ...member,
            taskStats,
          };
        })
      );

      return memberStats;
    }),

  /**
   * Get workload statistics for all team members
   */
  getWorkloadStatistics: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getWorkloadStatistics(input.projectId);
    }),

  /**
   * Get workload for a specific user
   */
  getUserWorkload: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserWorkload(input.userId);
    }),

  /**
   * Get role-based dashboard data
   */
  getRoleDashboardData: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getRoleDashboardData(ctx.user.id, ctx.user.role);
    }),
});
