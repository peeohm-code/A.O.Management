# คู่มือการพัฒนา Construction Management & QC Platform

**เอกสารฉบับนี้** จัดทำขึ้นเพื่อให้ผู้พัฒนาเข้าใจวิธีการสร้างระบบบริหารจัดการโครงการก่อสร้างและควบคุมคุณภาพ (Quality Control) แบบครบวงจร โดยใช้เทคโนโลยี **React 19**, **tRPC 11**, **Drizzle ORM**, **Express 4** และ **MySQL/TiDB** เป็นพื้นฐาน

---

## สารบัญ

1. [ภาพรวมของระบบ](#1-ภาพรวมของระบบ)
2. [สถาปัตยกรรมของระบบ](#2-สถาปัตยกรรมของระบบ)
3. [Database Schema](#3-database-schema)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [วิธีการสร้างแอปทีละขั้นตอน](#6-วิธีการสร้างแอปทีละขั้นตอน)
7. [Code Examples](#7-code-examples)
8. [Best Practices](#8-best-practices)

---

## 1. ภาพรวมของระบบ

### 1.1 วัตถุประสงค์

**Construction Management & QC Platform** เป็นระบบบริหารจัดการโครงการก่อสร้างที่ครบวงจร ออกแบบมาเพื่อช่วยให้ผู้บริหารโครงการ วิศวกร และทีมงานสามารถติดตามความคืบหน้า ควบคุมคุณภาพงาน และจัดการปัญหาต่างๆ ได้อย่างมีประสิทธิภาพ

### 1.2 ฟีเจอร์หลัก

ระบบประกอบด้วยฟีเจอร์สำคัญดังนี้:

**การบริหารโครงการ (Project Management)** ช่วยให้ผู้ใช้สามารถสร้างและจัดการโครงการก่อสร้างได้หลายโครงการพร้อมกัน โดยแต่ละโครงการสามารถกำหนดวันเริ่มต้น-สิ้นสุด งบประมาณ สถานที่ และสมาชิกทีมได้อย่างละเอียด

**การจัดการงาน (Task Management)** รองรับการสร้างงานย่อย (tasks) ภายในโครงการ พร้อมระบบติดตามสถานะ (To Do, In Progress, Done) การกำหนดผู้รับผิดชอบ วันครบกำหนด และความสัมพันธ์ระหว่างงาน (task dependencies) เพื่อวางแผนงานก่อสร้างได้อย่างเป็นระบบ

**ระบบตรวจสอบคุณภาพ (Quality Inspection)** ช่วยให้ทีม QC สามารถสร้าง checklist ตามมาตรฐานการก่อสร้าง บันทึกผลการตรวจสอบ (Pass/Fail/N/A) พร้อมแนบรูปภาพและความคิดเห็น เพื่อให้มั่นใจว่างานก่อสร้างเป็นไปตามมาตรฐาน

**การจัดการข้อบกพร่อง (Defect Management)** รองรับการรายงานข้อบกพร่องที่พบในงานก่อสร้าง จัดประเภทตามความรุนแรง (Low, Medium, High, Critical) ติดตามสถานะการแก้ไข และระบบ escalation อัตโนมัติเมื่อข้อบกพร่องไม่ได้รับการแก้ไขตามกำหนด

**ระบบแจ้งเตือน (Notification System)** แจ้งเตือนผู้ใช้แบบ real-time ผ่าน Server-Sent Events (SSE) และ push notifications เมื่อมีการเปลี่ยนแปลงสำคัญ เช่น งานใหม่ถูกมอบหมาย ข้อบกพร่องถูกรายงาน หรืองานใกล้ครบกำหนด

**Dashboard และรายงาน (Analytics)** แสดงสถิติและข้อมูลเชิงลึกของโครงการ เช่น ความคืบหน้าโครงการ จำนวนงานที่เสร็จสิ้น ข้อบกพร่องที่ค้างอยู่ และประสิทธิภาพของทีมงาน

### 1.3 เทคโนโลジีที่ใช้

| ส่วนประกอบ | เทคโนโลจี | เหตุผลในการเลือกใช้ |
|-----------|----------|---------------------|
| **Frontend** | React 19 + TypeScript | ประสิทธิภาพสูง รองรับ Server Components และ type safety |
| **UI Framework** | Tailwind CSS 4 + shadcn/ui | ออกแบบ UI ได้รวดเร็ว responsive และ accessible |
| **Backend** | Express 4 + tRPC 11 | End-to-end type safety ไม่ต้องเขียน REST API แยก |
| **Database** | MySQL/TiDB + Drizzle ORM | รองรับ scale ได้ดี type-safe queries |
| **File Storage** | AWS S3 | เก็บรูปภาพและเอกสารได้ไม่จำกัด |
| **Authentication** | Manus OAuth | ระบบ authentication สำเร็จรูป |
| **Real-time** | Server-Sent Events (SSE) | แจ้งเตือนแบบ real-time โดยไม่ต้องใช้ WebSocket |

---

## 2. สถาปัตยกรรมของระบบ

### 2.1 Architecture Overview

ระบบใช้สถาปัตยกรรมแบบ **Monolithic Full-Stack** โดยแบ่งเป็น 3 ชั้นหลัก:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  - Pages: Dashboard, Projects, Tasks, Inspections           │
│  - Components: Forms, Tables, Charts, Modals                 │
│  - Hooks: useAuth, useTRPC, useRealtimeNotifications        │
└─────────────────────────────────────────────────────────────┘
                              ↕ tRPC (Type-safe API)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + tRPC)                  │
│  - Routers: projectRouter, taskRouter, defectRouter         │
│  - Repositories: Database access layer (11 repositories)     │
│  - Services: Business logic, validation, notifications       │
└─────────────────────────────────────────────────────────────┘
                              ↕ Drizzle ORM
┌─────────────────────────────────────────────────────────────┐
│                   Database (MySQL/TiDB)                      │
│  - 46 tables: users, projects, tasks, defects, etc.         │
│  - Indexes: Optimized for common queries                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 โครงสร้างไฟล์โปรเจค

```
construction_management_app/
├── client/                      # Frontend code
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   └── InspectionList.tsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AIChatBox.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities
│   │   │   └── trpc.ts        # tRPC client setup
│   │   └── App.tsx            # Main app component
│   └── public/                # Static assets
├── server/                     # Backend code
│   ├── routers/               # tRPC routers (API endpoints)
│   │   ├── projectRouter.ts
│   │   ├── taskRouter.ts
│   │   ├── defectRouter.ts
│   │   └── checklistRouter.ts
│   ├── repositories/          # Database access layer
│   │   ├── project.repository.ts
│   │   ├── task.repository.ts
│   │   └── defect.repository.ts
│   ├── services/              # Business logic
│   ├── _core/                 # Framework code (OAuth, tRPC setup)
│   ├── db.ts                  # Legacy database functions
│   └── routers.ts             # Main router aggregation
├── drizzle/                   # Database schema & migrations
│   ├── schema.ts              # Table definitions (46 tables)
│   └── relations.ts           # Table relationships
├── shared/                    # Shared types & constants
│   ├── types.ts
│   ├── validations.ts
│   └── permissions.ts
└── tests/                     # Test files
    ├── integration/
    └── e2e/
```

### 2.3 Data Flow

การไหลของข้อมูลในระบบเป็นดังนี้:

1. **User Action**: ผู้ใช้กดปุ่มหรือกรอกฟอร์มใน React component
2. **tRPC Call**: Component เรียก `trpc.project.create.useMutation()` พร้อมส่งข้อมูล
3. **Router**: Backend router รับ request และ validate input
4. **Repository/Service**: เรียก repository function เพื่อเข้าถึงฐานข้อมูล
5. **Database**: Drizzle ORM execute SQL query ไปยัง MySQL
6. **Response**: ส่งผลลัพธ์กลับไปยัง frontend ผ่าน tRPC
7. **UI Update**: React component อัพเดท UI ด้วยข้อมูลใหม่

---

## 3. Database Schema

### 3.1 ตารางหลัก (Core Tables)

ระบบมีตารางทั้งหมด **46 ตาราง** แบ่งเป็นกลุ่มตามหน้าที่ดังนี้:

#### 3.1.1 User & Authentication

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **users** | ข้อมูลผู้ใช้งาน | id, openId, name, email, role (admin/user) |
| **userPermissions** | สิทธิ์การเข้าถึงของผู้ใช้ | userId, permission, granted |
| **permissions** | รายการสิทธิ์ที่มีในระบบ | id, name, description |

#### 3.1.2 Project Management

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **projects** | โครงการก่อสร้าง | id, name, description, status, startDate, endDate, budget |
| **projectMembers** | สมาชิกในโครงการ | projectId, userId, role (owner/manager/member/viewer) |
| **tasks** | งานภายในโครงการ | id, projectId, title, status, priority, assignedTo, dueDate |
| **taskDependencies** | ความสัมพันธ์ระหว่างงาน | taskId, dependsOnTaskId, dependencyType |
| **taskAssignments** | การมอบหมายงาน | taskId, userId, assignedAt |
| **taskComments** | ความคิดเห็นในงาน | id, taskId, userId, content |
| **taskAttachments** | ไฟล์แนบในงาน | id, taskId, fileUrl, fileName |

#### 3.1.3 Quality Control

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **checklistTemplates** | แม่แบบ checklist | id, name, category, stage (pre/in/post execution) |
| **checklistTemplateItems** | รายการใน checklist template | id, templateId, itemText, order |
| **taskChecklists** | Checklist ที่ผูกกับงาน | id, taskId, templateId, status, completedAt |
| **checklistItemResults** | ผลการตรวจสอบแต่ละรายการ | id, taskChecklistId, templateItemId, result (pass/fail/na) |
| **qcInspections** | การตรวจสอบคุณภาพ | id, projectId, taskId, inspectorId, status |
| **qcInspectionResults** | ผลการตรวจสอบ QC | id, inspectionId, checklistItemId, result |

#### 3.1.4 Defect Management

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **defects** | ข้อบกพร่องที่พบ | id, projectId, taskId, title, severity, status, type (CAR/PAR/NCR) |
| **defectAttachments** | รูปภาพข้อบกพร่อง | id, defectId, fileUrl, attachmentType (before/after) |
| **defectInspections** | การตรวจสอบข้อบกพร่อง | id, defectId, inspectorId, result |
| **escalationRules** | กฎการ escalate | id, severity, hoursBeforeEscalation |
| **escalationLogs** | ประวัติการ escalate | id, defectId, fromLevel, toLevel, escalatedAt |

#### 3.1.5 Notifications & Activity

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **notifications** | การแจ้งเตือน | id, userId, type, title, content, isRead |
| **scheduledNotifications** | การแจ้งเตือนที่กำหนดเวลา | id, userId, scheduledFor, status |
| **activityLog** | บันทึกกิจกรรม | id, userId, action, resourceType, resourceId |
| **pushSubscriptions** | Push notification subscriptions | id, userId, endpoint, keys |

#### 3.1.6 Monitoring & Performance

| ตาราง | คำอธิบาย | Columns สำคัญ |
|-------|---------|--------------|
| **queryLogs** | บันทึก query performance | id, query, duration, timestamp |
| **errorLogs** | บันทึก errors | id, errorType, message, stack, userId |
| **memoryLogs** | บันทึกการใช้ memory | id, usedMemoryMb, timestamp |
| **dbStatistics** | สถิติฐานข้อมูล | tableName, rowCount, avgQueryTime |

### 3.2 ตัวอย่าง Schema Code

#### projects table

```typescript
// drizzle/schema.ts
export const projects = mysqlTable("projects", {
  id: int().autoincrement().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  status: mysqlEnum(['planning','active','on_hold','completed','cancelled'])
    .default('planning').notNull(),
  startDate: timestamp({ mode: 'date' }),
  endDate: timestamp({ mode: 'date' }),
  budget: int(),
  location: varchar({ length: 500 }),
  createdBy: int().notNull(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("statusIdx").on(table.status),
  index("createdByIdx").on(table.createdBy),
]);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
```

#### tasks table

```typescript
export const tasks = mysqlTable("tasks", {
  id: int().autoincrement().notNull(),
  projectId: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: mysqlEnum(['todo','in_progress','done','blocked'])
    .default('todo').notNull(),
  priority: mysqlEnum(['low','medium','high','urgent'])
    .default('medium').notNull(),
  assignedTo: int(),
  dueDate: timestamp({ mode: 'date' }),
  startDate: timestamp({ mode: 'date' }),
  completedAt: timestamp({ mode: 'date' }),
  estimatedHours: int(),
  actualHours: int(),
  category: mysqlEnum(['preparation','structure','architecture','mep','other']),
  createdBy: int().notNull(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("projectIdx").on(table.projectId),
  index("statusIdx").on(table.status),
  index("assignedToIdx").on(table.assignedTo),
  index("dueDateIdx").on(table.dueDate),
  index("projectStatusIdx").on(table.projectId, table.status),
]);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
```

#### defects table

```typescript
export const defects = mysqlTable("defects", {
  id: int().autoincrement().notNull(),
  projectId: int().notNull(),
  taskId: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: mysqlEnum([
    'reported','analysis','in_progress',
    'resolved','pending_reinspection','closed'
  ]).default('reported').notNull(),
  severity: mysqlEnum(['low','medium','high','critical'])
    .default('medium').notNull(),
  type: mysqlEnum(['CAR','PAR','NCR']).default('CAR').notNull(),
  assignedTo: int(),
  reportedBy: int().notNull(),
  resolvedBy: int(),
  resolvedAt: timestamp({ mode: 'date' }),
  dueDate: timestamp({ mode: 'date' }),
  escalationLevel: int().default(0).notNull(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("projectIdx").on(table.projectId),
  index("taskIdx").on(table.taskId),
  index("statusIdx").on(table.status),
  index("severityIdx").on(table.severity),
  index("assignedToIdx").on(table.assignedTo),
]);

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;
```

### 3.3 Database Relationships

ความสัมพันธ์ระหว่างตารางหลัก:

```
users (1) ─────< (N) projects (createdBy)
              │
              └─< (N) projectMembers (userId)
              
projects (1) ──< (N) tasks (projectId)
              │
              └─< (N) defects (projectId)
              
tasks (1) ─────< (N) taskChecklists (taskId)
          │
          ├───< (N) taskComments (taskId)
          │
          ├───< (N) taskAttachments (taskId)
          │
          └───< (N) defects (taskId)

checklistTemplates (1) ──< (N) checklistTemplateItems
                        │
                        └─< (N) taskChecklists (templateId)

taskChecklists (1) ──< (N) checklistItemResults
```

---

## 4. Backend Architecture

### 4.1 tRPC Router Structure

Backend ใช้ **tRPC** เป็น API layer โดยแบ่ง routers ตามฟีเจอร์:

```typescript
// server/routers.ts
export const appRouter = router({
  // Core features
  project: projectRouter,
  task: taskRouter,
  defect: defectRouter,
  checklist: checklistRouter,
  inspection: inspectionRouter,
  
  // Supporting features
  comment: commentRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  activity: activityRouter,
  dashboard: dashboardRouter,
  
  // Admin features
  userManagement: userManagementRouter,
  team: teamRouter,
  escalation: escalationRouter,
  
  // System
  auth: authRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
```

### 4.2 Repository Pattern

ระบบใช้ **Repository Pattern** เพื่อแยก database access logic ออกจาก business logic:

```
server/repositories/
├── base.repository.ts          # Base class สำหรับ repositories
├── project.repository.ts       # Project-related queries
├── task.repository.ts          # Task-related queries
├── defect.repository.ts        # Defect-related queries
├── checklist.repository.ts     # Checklist-related queries
├── user.repository.ts          # User-related queries
├── notification.repository.ts  # Notification queries
├── analytics.repository.ts     # Analytics & statistics
└── index.ts                    # Export all repositories
```

#### ตัวอย่าง Repository

```typescript
// server/repositories/project.repository.ts
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { projects, projectMembers } from "../../drizzle/schema";

export class ProjectRepository {
  /**
   * สร้างโครงการใหม่
   */
  async createProject(data: InsertProject): Promise<number> {
    const db = await getDb();
    const result = await db.insert(projects).values(data);
    return Number(result.insertId);
  }

  /**
   * ดึงข้อมูลโครงการตาม ID
   */
  async getProjectById(projectId: number) {
    const db = await getDb();
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    return result[0];
  }

  /**
   * ดึงโครงการทั้งหมดที่ user เป็นสมาชิก
   */
  async getProjectsByUserId(userId: number) {
    const db = await getDb();
    return await db
      .select({
        project: projects,
        role: projectMembers.role,
      })
      .from(projects)
      .innerJoin(
        projectMembers,
        eq(projects.id, projectMembers.projectId)
      )
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  /**
   * อัพเดทโครงการ
   */
  async updateProject(projectId: number, data: Partial<InsertProject>) {
    const db = await getDb();
    await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, projectId));
  }

  /**
   * ลบโครงการ
   */
  async deleteProject(projectId: number) {
    const db = await getDb();
    await db.delete(projects).where(eq(projects.id, projectId));
  }
}

export const projectRepository = new ProjectRepository();
```

### 4.3 tRPC Procedures

#### ตัวอย่าง Project Router

```typescript
// server/routers/projectRouter.ts
import { router, protectedProcedure } from "../_core/trpc";
import { projectRepository } from "../repositories/project.repository";
import { z } from "zod";

export const projectRouter = router({
  /**
   * สร้างโครงการใหม่
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      budget: z.number().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const projectId = await projectRepository.createProject({
        ...input,
        createdBy: ctx.user.id,
      });
      
      // เพิ่ม creator เป็น owner
      await projectRepository.addMember(projectId, ctx.user.id, 'owner');
      
      return { projectId };
    }),

  /**
   * ดึงรายการโครงการทั้งหมดของ user
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await projectRepository.getProjectsByUserId(ctx.user.id);
    }),

  /**
   * ดึงข้อมูลโครงการตาม ID
   */
  getById: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await projectRepository.getProjectById(input.projectId);
    }),

  /**
   * อัพเดทโครงการ
   */
  update: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['planning','active','on_hold','completed','cancelled']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { projectId, ...data } = input;
      await projectRepository.updateProject(projectId, data);
      return { success: true };
    }),

  /**
   * ลบโครงการ
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await projectRepository.deleteProject(input.projectId);
      return { success: true };
    }),
});
```

#### ตัวอย่าง Task Router

```typescript
// server/routers/taskRouter.ts
import { router, protectedProcedure } from "../_core/trpc";
import { taskRepository } from "../repositories/task.repository";
import { emitNotification } from "../notifications/realtime";
import { z } from "zod";

export const taskRouter = router({
  /**
   * สร้างงานใหม่
   */
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      assignedTo: z.number().optional(),
      dueDate: z.date().optional(),
      priority: z.enum(['low','medium','high','urgent']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const taskId = await taskRepository.createTask({
        ...input,
        createdBy: ctx.user.id,
      });
      
      // ส่ง real-time notification
      if (input.assignedTo) {
        emitNotification({
          userId: input.assignedTo,
          type: 'task_assigned',
          title: 'งานใหม่ถูกมอบหมายให้คุณ',
          content: input.title,
        });
      }
      
      return { taskId };
    }),

  /**
   * ดึงงานทั้งหมดในโครงการ
   */
  listByProject: protectedProcedure
    .input(z.object({ 
      projectId: z.number(),
      status: z.enum(['todo','in_progress','done','blocked']).optional(),
    }))
    .query(async ({ input }) => {
      return await taskRepository.getTasksByProject(
        input.projectId,
        input.status
      );
    }),

  /**
   * อัพเดทสถานะงาน
   */
  updateStatus: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      status: z.enum(['todo','in_progress','done','blocked']),
    }))
    .mutation(async ({ input }) => {
      await taskRepository.updateTask(input.taskId, {
        status: input.status,
        completedAt: input.status === 'done' ? new Date() : null,
      });
      
      return { success: true };
    }),
});
```

### 4.4 Authentication & Authorization

#### Protected Procedure

```typescript
// server/_core/trpc.ts
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

#### Role-Based Access Control

```typescript
// server/_core/trpc.ts
export const roleBasedProcedure = protectedProcedure.use(({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      checkRole: (allowedRoles: string[]) => {
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
      },
    },
  });
});

// ใช้งาน
export const adminRouter = router({
  deleteUser: roleBasedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      ctx.checkRole(['admin']);
      // ... delete user logic
    }),
});
```

---

## 5. Frontend Architecture

### 5.1 Component Structure

Frontend ใช้ **React 19** พร้อม **TypeScript** และ **shadcn/ui** สำหรับ UI components:

```
client/src/
├── pages/                    # Page-level components
│   ├── Dashboard.tsx        # Dashboard หลัก
│   ├── ProjectList.tsx      # รายการโครงการ
│   ├── ProjectDetail.tsx    # รายละเอียดโครงการ
│   ├── TaskBoard.tsx        # Kanban board สำหรับงาน
│   ├── InspectionList.tsx   # รายการตรวจสอบคุณภาพ
│   └── DefectList.tsx       # รายการข้อบกพร่อง
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── table.tsx
│   ├── DashboardLayout.tsx  # Layout พร้อม sidebar
│   ├── ProjectCard.tsx      # Card แสดงโครงการ
│   ├── TaskCard.tsx         # Card แสดงงาน
│   └── DefectForm.tsx       # Form สร้าง/แก้ไขข้อบกพร่อง
└── hooks/                   # Custom hooks
    ├── useAuth.ts           # Authentication state
    ├── usePermissions.ts    # Permission checking
    └── useRealtimeNotifications.ts
```

### 5.2 tRPC Client Setup

```typescript
// client/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// client/src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 5.3 ตัวอย่าง Page Components

#### ProjectList Page

```typescript
// client/src/pages/ProjectList.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";

export default function ProjectList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // ดึงรายการโครงการ
  const { data: projects, isLoading } = trpc.project.list.useQuery();
  
  // Mutation สำหรับสร้างโครงการ
  const utils = trpc.useUtils();
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setShowCreateDialog(false);
    },
  });

  if (isLoading) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">โครงการทั้งหมด</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างโครงการใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((item) => (
          <Card key={item.project.id} className="p-6">
            <h3 className="text-xl font-semibold mb-2">
              {item.project.name}
            </h3>
            <p className="text-muted-foreground mb-4">
              {item.project.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                สถานะ: {item.project.status}
              </span>
              <span className="text-sm text-muted-foreground">
                บทบาท: {item.role}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => createProject.mutate(data)}
      />
    </div>
  );
}
```

#### TaskBoard Page (Kanban)

```typescript
// client/src/pages/TaskBoard.tsx
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { useParams } from "wouter";

export default function TaskBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { data: tasks } = trpc.task.listByProject.useQuery({
    projectId: Number(projectId),
  });

  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      trpc.useUtils().task.listByProject.invalidate();
    },
  });

  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const doneTasks = tasks?.filter(t => t.status === 'done') || [];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Task Board</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {/* To Do Column */}
        <div>
          <h2 className="text-xl font-semibold mb-4">To Do</h2>
          {todoTasks.map(task => (
            <Card key={task.id} className="p-4 mb-3">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => updateStatus.mutate({
                  taskId: task.id,
                  status: 'in_progress',
                })}
              >
                เริ่มทำงาน
              </Button>
            </Card>
          ))}
        </div>

        {/* In Progress Column */}
        <div>
          <h2 className="text-xl font-semibold mb-4">In Progress</h2>
          {inProgressTasks.map(task => (
            <Card key={task.id} className="p-4 mb-3">
              <h3 className="font-medium">{task.title}</h3>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => updateStatus.mutate({
                  taskId: task.id,
                  status: 'done',
                })}
              >
                เสร็จสิ้น
              </Button>
            </Card>
          ))}
        </div>

        {/* Done Column */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Done</h2>
          {doneTasks.map(task => (
            <Card key={task.id} className="p-4 mb-3 opacity-75">
              <h3 className="font-medium">{task.title}</h3>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.4 Real-time Notifications

```typescript
// client/src/hooks/useRealtimeNotifications.ts
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime/notifications');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      // แสดง toast notification
      toast(notification.title, {
        description: notification.content,
      });
      
      // Invalidate queries เพื่ออัพเดท UI
      trpc.useUtils().notification.list.invalidate();
    };

    return () => eventSource.close();
  }, []);
}
```

---

## 6. วิธีการสร้างแอปทีละขั้นตอน

### ขั้นตอนที่ 1: Setup โปรเจค

```bash
# 1. สร้างโปรเจคใหม่ด้วย Manus template
# (ใช้ webdev_init_project tool ใน Manus)

# 2. ติดตั้ง dependencies เพิ่มเติม
pnpm add drizzle-orm mysql2
pnpm add -D drizzle-kit

# 3. ตั้งค่า environment variables
# DATABASE_URL จะถูก inject อัตโนมัติโดย Manus
```

### ขั้นตอนที่ 2: ออกแบบ Database Schema

```typescript
// drizzle/schema.ts
import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// 1. สร้างตาราง projects
export const projects = mysqlTable("projects", {
  id: int().autoincrement().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  status: mysqlEnum(['planning','active','on_hold','completed','cancelled'])
    .default('planning').notNull(),
  startDate: timestamp({ mode: 'date' }),
  endDate: timestamp({ mode: 'date' }),
  budget: int(),
  createdBy: int().notNull(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
});

// 2. สร้างตาราง tasks
export const tasks = mysqlTable("tasks", {
  id: int().autoincrement().notNull(),
  projectId: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: mysqlEnum(['todo','in_progress','done','blocked'])
    .default('todo').notNull(),
  assignedTo: int(),
  dueDate: timestamp({ mode: 'date' }),
  createdBy: int().notNull(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
});

// 3. สร้างตาราง defects
export const defects = mysqlTable("defects", {
  id: int().autoincrement().notNull(),
  projectId: int().notNull(),
  taskId: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  severity: mysqlEnum(['low','medium','high','critical'])
    .default('medium').notNull(),
  status: mysqlEnum(['reported','in_progress','resolved','closed'])
    .default('reported').notNull(),
  reportedBy: int().notNull(),
  assignedTo: int(),
  createdAt: timestamp({ mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
});

// Export types
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Defect = typeof defects.$inferSelect;
```

```bash
# Push schema ไปยังฐานข้อมูล
pnpm db:push
```

### ขั้นตอนที่ 3: สร้าง Repository Layer

```typescript
// server/repositories/project.repository.ts
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { projects, type InsertProject } from "../../drizzle/schema";

export class ProjectRepository {
  async createProject(data: InsertProject) {
    const db = await getDb();
    const result = await db.insert(projects).values(data);
    return Number(result.insertId);
  }

  async getProjectById(id: number) {
    const db = await getDb();
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return result[0];
  }

  async updateProject(id: number, data: Partial<InsertProject>) {
    const db = await getDb();
    await db.update(projects).set(data).where(eq(projects.id, id));
  }

  async deleteProject(id: number) {
    const db = await getDb();
    await db.delete(projects).where(eq(projects.id, id));
  }
}

export const projectRepository = new ProjectRepository();
```

### ขั้นตอนที่ 4: สร้าง tRPC Router

```typescript
// server/routers/projectRouter.ts
import { router, protectedProcedure } from "../_core/trpc";
import { projectRepository } from "../repositories/project.repository";
import { z } from "zod";

export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const projectId = await projectRepository.createProject({
        ...input,
        createdBy: ctx.user.id,
      });
      return { projectId };
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      // ดึงโครงการทั้งหมดที่ user มีสิทธิ์เข้าถึง
      const db = await getDb();
      return await db.select().from(projects);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await projectRepository.getProjectById(input.id);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['planning','active','on_hold','completed','cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await projectRepository.updateProject(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await projectRepository.deleteProject(input.id);
      return { success: true };
    }),
});
```

```typescript
// server/routers.ts - รวม router เข้าด้วยกัน
import { projectRouter } from "./routers/projectRouter";

export const appRouter = router({
  project: projectRouter,
  // ... other routers
});
```

### ขั้นตอนที่ 5: สร้าง Frontend Components

```typescript
// client/src/pages/ProjectList.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function ProjectList() {
  const { data: projects, isLoading } = trpc.project.list.useQuery();
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      trpc.useUtils().project.list.invalidate();
    },
  });

  const [name, setName] = useState("");

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">โครงการทั้งหมด</h1>
      
      {/* Form สร้างโครงการ */}
      <Card className="p-4 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อโครงการ"
          className="border p-2 rounded mr-2"
        />
        <Button
          onClick={() => {
            createProject.mutate({ name });
            setName("");
          }}
        >
          สร้างโครงการ
        </Button>
      </Card>

      {/* รายการโครงการ */}
      <div className="grid gap-4">
        {projects?.map((project) => (
          <Card key={project.id} className="p-4">
            <h3 className="text-xl font-semibold">{project.name}</h3>
            <p className="text-muted-foreground">{project.description}</p>
            <p className="text-sm mt-2">สถานะ: {project.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### ขั้นตอนที่ 6: เพิ่ม Routes

```typescript
// client/src/App.tsx
import { Route, Switch } from "wouter";
import ProjectList from "./pages/ProjectList";
import TaskBoard from "./pages/TaskBoard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectList} />
      <Route path="/project/:projectId/tasks" component={TaskBoard} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### ขั้นตอนที่ 7: Testing

```typescript
// server/__tests__/project.test.ts
import { describe, it, expect } from "vitest";
import { projectRepository } from "../repositories/project.repository";

describe("Project Repository", () => {
  it("should create a project", async () => {
    const projectId = await projectRepository.createProject({
      name: "Test Project",
      createdBy: 1,
    });
    
    expect(projectId).toBeGreaterThan(0);
    
    const project = await projectRepository.getProjectById(projectId);
    expect(project.name).toBe("Test Project");
  });
});
```

```bash
# รัน tests
pnpm test
```

### ขั้นตอนที่ 8: Deployment

```bash
# 1. สร้าง checkpoint
# (ใช้ webdev_save_checkpoint tool)

# 2. กด Publish ใน Management UI
# ระบบจะ deploy แอปอัตโนมัติ
```

---

## 7. Code Examples

### 7.1 File Upload to S3

```typescript
// server/routers/attachmentRouter.ts
import { router, protectedProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { z } from "zod";

export const attachmentRouter = router({
  upload: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // แปลง base64 เป็น Buffer
      const buffer = Buffer.from(input.fileData, 'base64');
      
      // สร้าง unique key
      const fileKey = `tasks/${input.taskId}/${Date.now()}-${input.fileName}`;
      
      // Upload ไป S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      
      // บันทึกข้อมูลลงฐานข้อมูล
      const db = await getDb();
      await db.insert(taskAttachments).values({
        taskId: input.taskId,
        fileUrl: url,
        fileKey: fileKey,
        fileName: input.fileName,
        uploadedBy: ctx.user.id,
      });
      
      return { url };
    }),
});
```

### 7.2 Real-time Notifications

```typescript
// server/notifications/realtime.ts
import { EventEmitter } from "events";

const notificationEmitter = new EventEmitter();

export function emitNotification(data: {
  userId: number;
  type: string;
  title: string;
  content: string;
}) {
  notificationEmitter.emit(`user:${data.userId}`, data);
}

export function subscribeToNotifications(
  userId: number,
  callback: (data: any) => void
) {
  notificationEmitter.on(`user:${userId}`, callback);
  
  return () => {
    notificationEmitter.off(`user:${userId}`, callback);
  };
}
```

```typescript
// server/routers/realtimeRouter.ts
import { Router } from "express";
import { subscribeToNotifications } from "../notifications/realtime";

export const realtimeRouter = Router();

realtimeRouter.get("/notifications", (req, res) => {
  // ตั้งค่า SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).end();
    return;
  }
  
  // Subscribe to notifications
  const unsubscribe = subscribeToNotifications(userId, (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  
  // Cleanup on disconnect
  req.on("close", () => {
    unsubscribe();
  });
});
```

### 7.3 Defect Escalation System

```typescript
// server/jobs/escalationCheck.ts
import { getDb } from "../db/client";
import { defects, escalationRules, escalationLogs } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { emitNotification } from "../notifications/realtime";

export async function checkDefectEscalation() {
  const db = await getDb();
  
  // ดึง escalation rules
  const rules = await db.select().from(escalationRules);
  
  for (const rule of rules) {
    // หาข้อบกพร่องที่ต้อง escalate
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - rule.hoursBeforeEscalation);
    
    const defectsToEscalate = await db
      .select()
      .from(defects)
      .where(
        and(
          eq(defects.severity, rule.severity),
          eq(defects.status, 'reported'),
          lt(defects.createdAt, threshold)
        )
      );
    
    for (const defect of defectsToEscalate) {
      // Escalate
      await db
        .update(defects)
        .set({ escalationLevel: defect.escalationLevel + 1 })
        .where(eq(defects.id, defect.id));
      
      // บันทึก log
      await db.insert(escalationLogs).values({
        defectId: defect.id,
        fromLevel: defect.escalationLevel,
        toLevel: defect.escalationLevel + 1,
      });
      
      // แจ้งเตือน
      if (defect.assignedTo) {
        emitNotification({
          userId: defect.assignedTo,
          type: 'defect_escalated',
          title: 'ข้อบกพร่องถูก escalate',
          content: `${defect.title} ถูก escalate เป็นระดับ ${defect.escalationLevel + 1}`,
        });
      }
    }
  }
}

// รัน cron job ทุก 1 ชั่วโมง
import cron from "node-cron";
cron.schedule("0 * * * *", checkDefectEscalation);
```

### 7.4 Checklist Workflow

```typescript
// server/routers/checklistRouter.ts
export const checklistRouter = router({
  /**
   * สร้าง checklist instance จาก template
   */
  createInstance: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      templateId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // สร้าง checklist instance
      const result = await db.insert(taskChecklists).values({
        taskId: input.taskId,
        templateId: input.templateId,
        status: 'pending',
      });
      
      const checklistId = Number(result.insertId);
      
      // ดึง template items
      const templateItems = await db
        .select()
        .from(checklistTemplateItems)
        .where(eq(checklistTemplateItems.templateId, input.templateId));
      
      // สร้าง result rows สำหรับแต่ละ item
      for (const item of templateItems) {
        await db.insert(checklistItemResults).values({
          taskChecklistId: checklistId,
          templateItemId: item.id,
          result: 'na', // default
        });
      }
      
      return { checklistId };
    }),

  /**
   * อัพเดทผลการตรวจสอบ
   */
  updateItemResult: protectedProcedure
    .input(z.object({
      resultId: z.number(),
      result: z.enum(['pass','fail','na']),
      comments: z.string().optional(),
      photoUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db
        .update(checklistItemResults)
        .set({
          result: input.result,
          comments: input.comments,
          photoUrls: input.photoUrls?.join(','),
        })
        .where(eq(checklistItemResults.id, input.resultId));
      
      // ถ้า fail ให้สร้าง defect อัตโนมัติ
      if (input.result === 'fail') {
        const resultData = await db
          .select()
          .from(checklistItemResults)
          .where(eq(checklistItemResults.id, input.resultId))
          .limit(1);
        
        const checklist = await db
          .select()
          .from(taskChecklists)
          .where(eq(taskChecklists.id, resultData[0].taskChecklistId))
          .limit(1);
        
        // สร้าง defect
        await db.insert(defects).values({
          taskId: checklist[0].taskId,
          projectId: /* get from task */,
          title: `Checklist Failed: ${input.comments}`,
          severity: 'medium',
          reportedBy: ctx.user.id,
          checklistItemResultId: input.resultId,
        });
      }
      
      return { success: true };
    }),
});
```

---

## 8. Best Practices

### 8.1 Database Best Practices

**ใช้ Indexes อย่างเหมาะสม** เพื่อเพิ่มความเร็วในการ query โดยเฉพาะ columns ที่ใช้ใน WHERE, JOIN และ ORDER BY บ่อยๆ

```typescript
// ตัวอย่าง indexes ที่ดี
export const tasks = mysqlTable("tasks", {
  // ... columns
}, (table) => [
  index("projectIdx").on(table.projectId),          // สำหรับ WHERE projectId = ?
  index("statusIdx").on(table.status),              // สำหรับ WHERE status = ?
  index("assignedToIdx").on(table.assignedTo),      // สำหรับ WHERE assignedTo = ?
  index("projectStatusIdx").on(table.projectId, table.status), // Composite index
]);
```

**หลีกเลี่ยง N+1 Query Problem** โดยใช้ JOIN หรือ batch loading

```typescript
// ❌ Bad: N+1 queries
const projects = await db.select().from(projects);
for (const project of projects) {
  const tasks = await db.select().from(tasks)
    .where(eq(tasks.projectId, project.id));
}

// ✅ Good: Single query with JOIN
const projectsWithTasks = await db
  .select()
  .from(projects)
  .leftJoin(tasks, eq(projects.id, tasks.projectId));
```

**ใช้ Transactions สำหรับ operations ที่ต้องการ atomicity**

```typescript
await db.transaction(async (tx) => {
  const projectId = await tx.insert(projects).values(projectData);
  await tx.insert(projectMembers).values({
    projectId,
    userId: ctx.user.id,
    role: 'owner',
  });
});
```

### 8.2 tRPC Best Practices

**แยก Router ตามฟีเจอร์** เพื่อให้ code อ่านง่ายและ maintain ได้ดี

```typescript
// แยกเป็น feature-based routers
export const appRouter = router({
  project: projectRouter,
  task: taskRouter,
  defect: defectRouter,
  checklist: checklistRouter,
});
```

**ใช้ Zod สำหรับ Input Validation**

```typescript
const createTaskInput = z.object({
  title: z.string().min(1).max(255),
  projectId: z.number().positive(),
  dueDate: z.date().optional(),
  priority: z.enum(['low','medium','high','urgent']).default('medium'),
});

export const taskRouter = router({
  create: protectedProcedure
    .input(createTaskInput)
    .mutation(async ({ input }) => {
      // input is fully typed and validated
    }),
});
```

**ใช้ Optimistic Updates สำหรับ UX ที่ดีขึ้น**

```typescript
const updateTask = trpc.task.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await utils.task.list.cancel();
    
    // Snapshot previous value
    const previousTasks = utils.task.list.getData();
    
    // Optimistically update
    utils.task.list.setData(undefined, (old) =>
      old?.map(task =>
        task.id === newData.id ? { ...task, ...newData } : task
      )
    );
    
    return { previousTasks };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.task.list.setData(undefined, context?.previousTasks);
  },
  onSettled: () => {
    // Refetch after mutation
    utils.task.list.invalidate();
  },
});
```

### 8.3 Frontend Best Practices

**ใช้ Custom Hooks เพื่อ Reuse Logic**

```typescript
// hooks/useTaskActions.ts
export function useTaskActions(projectId: number) {
  const utils = trpc.useUtils();
  
  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.listByProject.invalidate({ projectId });
      toast.success("สร้างงานสำเร็จ");
    },
  });
  
  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.listByProject.invalidate({ projectId });
      toast.success("อัพเดทงานสำเร็จ");
    },
  });
  
  return { createTask, updateTask };
}
```

**แยก Components ให้เล็กและ Reusable**

```typescript
// components/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  onStatusChange: (status: string) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-medium">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.description}</p>
      <Select value={task.status} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
    </Card>
  );
}
```

**ใช้ Loading States และ Error Handling**

```typescript
export default function ProjectList() {
  const { data, isLoading, error } = trpc.project.list.useQuery();
  
  if (isLoading) {
    return <Skeleton className="h-32" />;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div>
      {data?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### 8.4 Security Best Practices

**ตรวจสอบสิทธิ์ในทุก Procedure**

```typescript
export const projectRouter = router({
  delete: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // ตรวจสอบว่า user เป็น owner หรือไม่
      const member = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!member[0] || member[0].role !== 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      await projectRepository.deleteProject(input.projectId);
      return { success: true };
    }),
});
```

**Sanitize User Input**

```typescript
import { sanitize } from "../utils/sanitize";

export const commentRouter = router({
  create: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      content: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const sanitizedContent = sanitize(input.content);
      
      await db.insert(taskComments).values({
        taskId: input.taskId,
        userId: ctx.user.id,
        content: sanitizedContent,
      });
    }),
});
```

**Rate Limiting**

```typescript
// server/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

// ใช้ใน Express
app.use("/api/", apiLimiter);
```

### 8.5 Performance Optimization

**ใช้ Pagination สำหรับ Large Datasets**

```typescript
export const taskRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize;
      
      const tasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, input.projectId))
        .limit(input.pageSize)
        .offset(offset);
      
      const total = await db
        .select({ count: sql`COUNT(*)` })
        .from(tasks)
        .where(eq(tasks.projectId, input.projectId));
      
      return {
        tasks,
        total: Number(total[0].count),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
});
```

**Cache Frequently Accessed Data**

```typescript
// ใช้ React Query cache
const { data: projects } = trpc.project.list.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
});
```

**Lazy Load Components**

```typescript
// App.tsx
import { lazy, Suspense } from "react";

const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const TaskBoard = lazy(() => import("./pages/TaskBoard"));

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/project/:id" component={ProjectDetail} />
        <Route path="/project/:id/tasks" component={TaskBoard} />
      </Switch>
    </Suspense>
  );
}
```

---

## สรุป

เอกสารฉบับนี้ครอบคลุมทุกด้านของการพัฒนา **Construction Management & QC Platform** ตั้งแต่การออกแบบฐานข้อมูล การสร้าง API ด้วย tRPC การพัฒนา UI ด้วย React ไปจนถึง best practices ต่างๆ ที่ควรปฏิบัติตาม

**จุดเด่นของระบบ** คือการใช้ **tRPC** ที่ให้ type safety แบบ end-to-end ทำให้การพัฒนารวดเร็วและลด bugs ที่เกิดจาก type mismatch การใช้ **Drizzle ORM** ช่วยให้เขียน SQL queries ได้อย่างปลอดภัยและมี autocomplete ที่ดี และการใช้ **shadcn/ui** ทำให้สร้าง UI ที่สวยงามและ accessible ได้อย่างรวดเร็ว

**สำหรับผู้ที่ต้องการพัฒนาต่อ** แนะนำให้เริ่มจากการทำความเข้าใจ database schema ก่อน จากนั้นศึกษา repository pattern และ tRPC routers เพื่อเข้าใจ data flow ของระบบ สุดท้ายจึงเริ่มพัฒนา frontend components ตามฟีเจอร์ที่ต้องการ

---

**เอกสารนี้จัดทำโดย:** Manus AI  
**วันที่อัพเดทล่าสุด:** 25 พฤศจิกายน 2025
