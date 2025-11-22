import { eq, and, desc, count, like, isNull, sql, inArray } from "drizzle-orm";
import {
  projects,
  projectMembers,
  tasks,
  checklistTemplates,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { bigIntToNumber } from "../utils/bigint";

/**
 * Project Repository
 * 
 * Handles all project-related database operations
 */
export class ProjectRepository extends BaseRepository {
  /**
   * Generate unique project code for the current year
   */
  async generateProjectCode(): Promise<string> {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const currentYear = new Date().getFullYear();
    const prefix = `AO-${currentYear}-`;

    // Get the latest project code for this year
    const latestProjects = await this.db
      .select({ code: projects.code })
      .from(projects)
      .where(like(projects.code, `${prefix}%`))
      .orderBy(desc(projects.code))
      .limit(1);

    if (latestProjects.length === 0) {
      // First project of the year
      return `${prefix}001`;
    }

    const latestCode = latestProjects[0].code;
    if (!latestCode) {
      return `${prefix}001`;
    }

    // Extract the number part and increment
    const match = latestCode.match(/AO-(\d{4})-(\d{3})/);
    if (!match) {
      return `${prefix}001`;
    }

    const number = parseInt(match[2], 10) + 1;
    return `${prefix}${number.toString().padStart(3, '0')}`;
  }

  /**
   * Create new project
   */
  async createProject(data: {
    name: string;
    code?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    ownerName?: string;
    startDate?: string;
    endDate?: string;
    createdBy: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Convert date strings to Date objects
    const values: typeof projects.$inferInsert = {
      name: data.name,
      createdBy: data.createdBy,
    };
    
    // Auto-generate code if not provided
    if (data.code) {
      values.code = data.code;
    } else {
      values.code = await this.generateProjectCode();
    }
    
    if (data.location) values.location = data.location;
    if (data.latitude) values.latitude = data.latitude;
    if (data.longitude) values.longitude = data.longitude;
    if (data.ownerName) values.ownerName = data.ownerName;
    if (data.startDate) values.startDate = data.startDate;
    if (data.endDate) values.endDate = data.endDate;

    const [result] = await this.db.insert(projects).values(values);
    
    const projectId = bigIntToNumber(result.insertId);
    
    if (projectId && !isNaN(projectId)) {
      await this.db.insert(projectMembers).values({
        projectId,
        userId: data.createdBy,
        role: 'project_manager',
      });
    }
    
    return { insertId: projectId, id: projectId };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get all active projects (not archived)
   */
  async getAllProjects() {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(projects)
      .where(isNull(projects.archivedAt));
  }

  /**
   * Get projects with pagination
   */
  async getProjectsPaginated(page: number, pageSize: number) {
    if (!this.db) return { items: [], total: 0 };

    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(projects)
      .where(isNull(projects.archivedAt));
    const total = countResult[0]?.count || 0;

    // Get paginated items
    const items = await this.db
      .select()
      .from(projects)
      .where(isNull(projects.archivedAt))
      .orderBy(desc(projects.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  /**
   * Get projects by user ID
   */
  async getProjectsByUser(userId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projectMembers.userId, userId),
          isNull(projects.archivedAt)
        )
      );
  }

  /**
   * Validate project completeness for opening (minimum 70%)
   */
  async validateProjectCompleteness(projectId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const project = await this.getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    const checks = {
      basicInfo: 0,
      timeline: 0,
      team: 0,
      tasks: 0,
      checklists: 0,
    };

    const details: Array<{ category: string; status: 'complete' | 'incomplete'; message: string }> = [];

    // 1. Basic Info (20%): name, code, location
    if (project.name && project.code && project.location) {
      checks.basicInfo = 20;
      details.push({ category: 'ข้อมูลพื้นฐาน', status: 'complete', message: 'ชื่อโครงการ, รหัส, และที่อยู่ครบถ้วน' });
    } else {
      details.push({ category: 'ข้อมูลพื้นฐาน', status: 'incomplete', message: 'ต้องระบุชื่อโครงการ, รหัส, และที่อยู่' });
    }

    // 2. Timeline (20%): startDate, endDate
    if (project.startDate && project.endDate) {
      checks.timeline = 20;
      details.push({ category: 'ระยะเวลาโครงการ', status: 'complete', message: 'มีวันเริ่มต้นและวันสิ้นสุด' });
    } else {
      details.push({ category: 'ระยะเวลาโครงการ', status: 'incomplete', message: 'ต้องระบุวันเริ่มต้นและวันสิ้นสุด' });
    }

    // 3. Team (15%): at least 1 member
    const members = await this.db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    
    if (members.length > 0) {
      checks.team = 15;
      details.push({ category: 'ทีมงาน', status: 'complete', message: `มีสมาชิก ${members.length} คน` });
    } else {
      details.push({ category: 'ทีมงาน', status: 'incomplete', message: 'ต้องมีสมาชิกอย่างน้อย 1 คน' });
    }

    // 4. Tasks (15%): at least 1 task
    const projectTasks = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    if (projectTasks.length > 0) {
      checks.tasks = 15;
      details.push({ category: 'งาน', status: 'complete', message: `มีงาน ${projectTasks.length} งาน` });
    } else {
      details.push({ category: 'งาน', status: 'incomplete', message: 'ต้องมีงานอย่างน้อย 1 งาน' });
    }

    // 5. Checklist Templates (10%): at least 1 template (optional but recommended)
    const templates = await this.db
      .select()
      .from(checklistTemplates);
    
    if (templates.length > 0) {
      checks.checklists = 10;
      details.push({ category: 'Checklist Templates', status: 'complete', message: `มี ${templates.length} templates` });
    } else {
      details.push({ category: 'Checklist Templates', status: 'incomplete', message: 'แนะนำให้มี checklist template อย่างน้อย 1 อัน' });
    }

    const totalPercentage = Object.values(checks).reduce((sum: any, val) => sum + val, 0);

    return {
      percentage: totalPercentage,
      isValid: totalPercentage >= 70,
      checks,
      details,
    };
  }

  /**
   * Open project - change status from draft to planning or active
   */
  async openProject(projectId: number, newStatus: 'planning' | 'active') {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Validate completeness first
    const validation = await this.validateProjectCompleteness(projectId);
    if (!validation.isValid) {
      throw new Error(`โครงการมีความสมบูรณ์เพียง ${validation.percentage}% (ต้องการอย่างน้อย 70%)`);
    }

    // Update project status
    await this.db
      .update(projects)
      .set({ status: newStatus })
      .where(eq(projects.id, projectId));

    return { success: true };
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: number) {
    if (!this.db) return null;

    const project = await this.getProjectById(projectId);
    if (!project) return null;

    // Get task counts by status
    const taskStats = await this.db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .groupBy(tasks.status);

    const stats = {
      todo: 0,
      in_progress: 0,
      in_review: 0,
      completed: 0,
      total: 0,
    };

    taskStats.forEach((stat: any) => {
      const status = stat.status as keyof typeof stats;
      if (status in stats) {
        stats[status] = Number(stat.count);
      }
      stats.total += Number(stat.count);
    });

    return {
      projectId,
      projectName: project.name,
      ...stats,
    };
  }

  /**
   * Get batch project statistics for multiple projects
   */
  async getBatchProjectStats(projectIds: number[]) {
    if (!this.db || projectIds.length === 0) return [];

    const taskStats = await this.db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds))
      .groupBy(tasks.projectId, tasks.status);

    const projectsData = await this.db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds));

    const statsMap = new Map<number, any>();

    // Initialize stats for all projects
    projectsData.forEach((project: any) => {
      statsMap.set(project.id, {
        projectId: project.id,
        projectName: project.name,
        todo: 0,
        in_progress: 0,
        in_review: 0,
        completed: 0,
        total: 0,
      });
    });

    // Fill in task counts
    taskStats.forEach((stat: any) => {
      const projectStat = statsMap.get(stat.projectId);
      if (projectStat) {
        const status = stat.status;
        if (status in projectStat) {
          projectStat[status] = Number(stat.count);
        }
        projectStat.total += Number(stat.count);
      }
    });

    return Array.from(statsMap.values());
  }

  /**
   * Update project
   */
  async updateProject(
    id: number,
    data: {
      name?: string;
      code?: string;
      location?: string;
      latitude?: string;
      longitude?: string;
      ownerName?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      description?: string;
    }
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;

    await this.db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id));

    return { success: true };
  }

  /**
   * Delete project (soft delete - marks as archived)
   */
  async deleteProject(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Check if project has tasks
    const projectTasks = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, id))
      .limit(1);

    if (projectTasks.length > 0) {
      throw new Error("Cannot delete project with existing tasks. Archive it instead.");
    }

    // Soft delete by setting archivedAt
    await this.db
      .update(projects)
      .set({ archivedAt: new Date() })
      .where(eq(projects.id, id));

    return { success: true };
  }

  /**
   * Archive project
   */
  async archiveProject(projectId: number, userId: number, reason?: string) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    await this.db
      .update(projects)
      .set({
        archivedAt: new Date(),
        status: 'cancelled',
      })
      .where(eq(projects.id, projectId));

    return { success: true };
  }

  /**
   * Unarchive project
   */
  async unarchiveProject(projectId: number, userId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    await this.db
      .update(projects)
      .set({
        archivedAt: null,
        status: 'planning',
      })
      .where(eq(projects.id, projectId));

    return { success: true };
  }

  /**
   * Get archived projects for a user
   */
  async getArchivedProjects(userId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projectMembers.userId, userId),
          sql`${projects.archivedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(projects.archivedAt));
  }

  /**
   * Add project member
   */
  async addProjectMember(data: {
    projectId: number;
    userId: number;
    role: string;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    await this.db.insert(projectMembers).values({
      projectId: data.projectId,
      userId: data.userId,
      role: data.role as 'project_manager' | 'qc_inspector' | 'worker',
    });
    return { success: true };
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  /**
   * Remove project member
   */
  async removeProjectMember(projectId: number, userId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    await this.db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );

    return { success: true };
  }

  /**
   * Update project member role
   */
  async updateProjectMemberRole(
    projectId: number,
    userId: number,
    role: string
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    await this.db
      .update(projectMembers)
      .set({ role: role as 'project_manager' | 'qc_inspector' | 'worker' })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );

    return { success: true };
  }

  /**
   * Get user projects
   */
  async getUserProjects(userId: number) {
    if (!this.db) return [];

    return await this.db
      .select({
        project: projects,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(
        and(
          eq(projectMembers.userId, userId),
          isNull(projects.archivedAt)
        )
      );
  }
}
