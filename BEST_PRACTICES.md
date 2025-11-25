# Best Practices Guide - Construction Management Platform

## 📚 Table of Contents
1. [N+1 Query Optimization](#n1-query-optimization)
2. [Null Safety & Error Handling](#null-safety--error-handling)
3. [RBAC Authorization](#rbac-authorization)
4. [Code Refactoring Guidelines](#code-refactoring-guidelines)
5. [Performance Optimization](#performance-optimization)

---

## 🚀 N+1 Query Optimization

### Problem: The N+1 Query Anti-Pattern

**What is N+1?**
```typescript
// ❌ BAD: N+1 Query Problem
// 1 query to get projects + N queries to get stats for each project
const projects = await db.select().from(projects); // 1 query

for (const project of projects) {
  const taskCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tasks)
    .where(eq(tasks.projectId, project.id)); // N queries
  
  project.taskCount = taskCount[0].count;
}
```

**Why is it bad?**
- 1 project = 2 queries (1 + 1)
- 10 projects = 11 queries (1 + 10)
- 100 projects = 101 queries (1 + 100)
- **Exponential performance degradation!**

---

### Solution 1: Use JOIN with Aggregation

```typescript
// ✅ GOOD: Single query with JOIN and aggregation
const projectsWithStats = await db
  .select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
    // ... other project fields
    taskCount: sql<number>`COUNT(DISTINCT ${tasks.id})`.as('taskCount'),
    completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`.as('completedTasks'),
    progressPercentage: sql<number>`
      CASE 
        WHEN COUNT(DISTINCT ${tasks.id}) > 0 
        THEN (SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END) * 100 / COUNT(DISTINCT ${tasks.id}))
        ELSE 0 
      END
    `.as('progressPercentage'),
  })
  .from(projects)
  .leftJoin(tasks, eq(tasks.projectId, projects.id))
  .groupBy(projects.id);
```

**Benefits:**
- 1 query for any number of projects
- 10x-100x faster for large datasets
- Reduced database load

---

### Solution 2: Batch Loading with IN Clause

```typescript
// ✅ GOOD: Batch load related data
// Step 1: Get all projects (1 query)
const projects = await db.select().from(projects);
const projectIds = projects.map(p => p.id);

// Step 2: Get all stats in one query (1 query)
const allStats = await db
  .select({
    projectId: tasks.projectId,
    taskCount: sql<number>`COUNT(*)`.as('taskCount'),
    completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`.as('completedTasks'),
  })
  .from(tasks)
  .where(sql`${tasks.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`)
  .groupBy(tasks.projectId);

// Step 3: Map stats to projects (in-memory)
const statsMap = new Map(allStats.map(s => [s.projectId, s]));
const projectsWithStats = projects.map(p => ({
  ...p,
  ...statsMap.get(p.id),
}));
```

**Benefits:**
- Only 2 queries regardless of project count
- Easy to understand and maintain
- Good for complex aggregations

---

### Solution 3: Use Drizzle Relations (Eager Loading)

```typescript
// Define relations in schema
export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  members: many(projectMembers),
  defects: many(defects),
}));

// ✅ GOOD: Eager load with relations
const projectsWithTasks = await db.query.projects.findMany({
  with: {
    tasks: true,
    members: {
      with: {
        user: true,
      },
    },
  },
});

// Calculate stats in-memory
const projectsWithStats = projectsWithTasks.map(p => ({
  ...p,
  taskCount: p.tasks.length,
  completedTasks: p.tasks.filter(t => t.status === 'completed').length,
  progressPercentage: p.tasks.length > 0 
    ? (p.tasks.filter(t => t.status === 'completed').length / p.tasks.length) * 100 
    : 0,
}));
```

**Benefits:**
- Clean and readable code
- Automatic JOIN generation
- Type-safe relations

---

### Common N+1 Patterns to Fix

#### 1. Project List with Stats
```typescript
// ❌ BAD
const projects = await getAllProjects();
for (const project of projects) {
  project.stats = await getProjectStats(project.id); // N queries
}

// ✅ GOOD
const projectIds = await getAllProjectIds();
const statsMap = await getBatchProjectStats(projectIds); // 1 query
const projects = projectsData.map(p => ({
  ...p,
  stats: statsMap.get(p.id),
}));
```

#### 2. Task List with Assignees
```typescript
// ❌ BAD
const tasks = await getAllTasks();
for (const task of tasks) {
  task.assignee = await getUserById(task.assigneeId); // N queries
}

// ✅ GOOD
const tasks = await db
  .select({
    ...tasks,
    assigneeName: users.name,
    assigneeEmail: users.email,
  })
  .from(tasks)
  .leftJoin(users, eq(users.id, tasks.assigneeId));
```

#### 3. Defect List with Related Data
```typescript
// ❌ BAD
const defects = await getAllDefects();
for (const defect of defects) {
  defect.project = await getProjectById(defect.projectId); // N queries
  defect.task = await getTaskById(defect.taskId); // N queries
  defect.assignee = await getUserById(defect.assignedTo); // N queries
}

// ✅ GOOD
const defects = await db
  .select({
    ...defects,
    projectName: projects.name,
    taskName: tasks.name,
    assigneeName: users.name,
  })
  .from(defects)
  .leftJoin(projects, eq(projects.id, defects.projectId))
  .leftJoin(tasks, eq(tasks.id, defects.taskId))
  .leftJoin(users, eq(users.id, defects.assignedTo));
```

---

## 🛡️ Null Safety & Error Handling

### Problem: Runtime Null/Undefined Errors

```typescript
// ❌ BAD: No null checks
const user = await getUserById(userId);
return user.email; // Crashes if user is null
```

---

### Solution 1: Optional Chaining & Nullish Coalescing

```typescript
// ✅ GOOD: Optional chaining
const user = await getUserById(userId);
return user?.email ?? 'N/A';

// ✅ GOOD: With default object
const user = await getUserById(userId) ?? { email: 'N/A', name: 'Unknown' };
return user.email;
```

---

### Solution 2: Early Return Pattern

```typescript
// ✅ GOOD: Early return with clear error
async function getProjectDetails(projectId: number) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  if (!project[0]) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Project with ID ${projectId} not found`,
    });
  }
  
  return project[0];
}
```

---

### Solution 3: Type Guards

```typescript
// ✅ GOOD: Type guard function
function isValidUser(user: any): user is User {
  return user && typeof user.id === 'number' && typeof user.email === 'string';
}

const user = await getUserById(userId);
if (!isValidUser(user)) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid user data' });
}
// TypeScript now knows user is User type
return user.email;
```

---

### Solution 4: Zod Validation for Runtime Safety

```typescript
// ✅ GOOD: Validate database results
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

const rawUser = await getUserById(userId);
const user = userSchema.parse(rawUser); // Throws if invalid
return user.email; // Safe!
```

---

### Error Handling Best Practices

#### 1. Consistent Error Format
```typescript
// ✅ GOOD: Consistent error handling
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('[Operation] Failed:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error',
    cause: error,
  });
}
```

#### 2. Specific Error Codes
```typescript
// ✅ GOOD: Use appropriate error codes
if (!hasPermission) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
}

if (!resourceExists) {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
}

if (!validInput) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input' });
}
```

#### 3. Graceful Degradation
```typescript
// ✅ GOOD: Graceful fallback
async function getDashboardStats(userId: number) {
  try {
    const stats = await calculateComplexStats(userId);
    return stats;
  } catch (error) {
    console.error('[Dashboard] Stats calculation failed:', error);
    // Return default stats instead of crashing
    return {
      projectCount: 0,
      taskCount: 0,
      defectCount: 0,
      message: 'Stats temporarily unavailable',
    };
  }
}
```

---

## 🔐 RBAC Authorization

### Problem: Inconsistent Permission Checks

```typescript
// ❌ BAD: No authorization check
update: protectedProcedure
  .input(updateProjectSchema)
  .mutation(async ({ input }) => {
    // Anyone can update any project!
    return await db.updateProject(input);
  });
```

---

### Solution 1: Helper Functions

```typescript
// ✅ GOOD: Reusable authorization helpers
// server/auth/permissions.ts

export async function hasProjectAccess(userId: number, projectId: number): Promise<boolean> {
  const member = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    )
    .limit(1);
  
  return member.length > 0;
}

export async function isProjectManager(userId: number, projectId: number): Promise<boolean> {
  const member = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.role, 'project_manager')
      )
    )
    .limit(1);
  
  return member.length > 0;
}

export async function isQCInspector(userId: number): Promise<boolean> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user[0]?.role === 'qc_inspector' || user[0]?.role === 'admin';
}
```

---

### Solution 2: Authorization Middleware

```typescript
// ✅ GOOD: Custom procedure with authorization
// server/_core/trpc.ts

export const projectAccessProcedure = protectedProcedure.use(async ({ ctx, next, rawInput }) => {
  const input = rawInput as { projectId?: number; id?: number };
  const projectId = input.projectId || input.id;
  
  if (!projectId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Project ID required' });
  }
  
  const hasAccess = await hasProjectAccess(ctx.user.id, projectId);
  if (!hasAccess) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this project' });
  }
  
  return next({ ctx });
});

// Usage in routers
update: projectAccessProcedure
  .input(updateProjectSchema)
  .mutation(async ({ input }) => {
    // User already verified to have access
    return await db.updateProject(input);
  });
```

---

### Solution 3: Resource-Level Permissions

```typescript
// ✅ GOOD: Check resource ownership
updateDefect: protectedProcedure
  .input(updateDefectSchema)
  .mutation(async ({ input, ctx }) => {
    // Get defect with project info
    const defect = await db
      .select({
        defect: defects,
        projectId: tasks.projectId,
      })
      .from(defects)
      .leftJoin(tasks, eq(tasks.id, defects.taskId))
      .where(eq(defects.id, input.id))
      .limit(1);
    
    if (!defect[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Defect not found' });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(ctx.user.id, defect[0].projectId);
    if (!hasAccess) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this defect' });
    }
    
    // Additional check: only assignee or QC inspector can update
    const isAssignee = defect[0].defect.assignedTo === ctx.user.id;
    const isInspector = await isQCInspector(ctx.user.id);
    
    if (!isAssignee && !isInspector) {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: 'Only assignee or QC inspector can update this defect' 
      });
    }
    
    return await db.updateDefect(input);
  });
```

---

### RBAC Matrix

| Role | Projects | Tasks | Defects | Inspections | Templates |
|------|----------|-------|---------|-------------|-----------|
| **Owner** | Full | Full | Full | Full | Full |
| **Admin** | Full | Full | Full | Full | Full |
| **Project Manager** | Own projects | Own projects | Own projects | Approve | View |
| **QC Inspector** | View | View | Manage | Conduct | View |
| **Worker** | View assigned | View/Update assigned | View assigned | - | View |

---

### Audit Logging

```typescript
// ✅ GOOD: Log sensitive operations
async function deleteProject(projectId: number, userId: number) {
  const project = await getProjectById(projectId);
  
  // Log before deletion
  await db.insert(userActivityLogs).values({
    userId,
    action: 'project_deleted',
    module: 'projects',
    details: JSON.stringify({
      projectId,
      projectName: project.name,
      timestamp: new Date(),
    }),
  });
  
  // Perform deletion
  await db.delete(projects).where(eq(projects.id, projectId));
  
  // Notify relevant users
  await notifyProjectDeletion(projectId, userId);
}
```

---

## 🔧 Code Refactoring Guidelines

### When to Refactor

**Refactor when:**
- Function > 50 lines
- Duplicate code appears 3+ times
- Complex nested conditions (> 3 levels)
- Hard to understand or test
- Performance issues

**Don't refactor when:**
- Code works and is clear
- No tests exist yet
- Under tight deadline
- Unclear requirements

---

### Refactoring Pattern 1: Extract Function

```typescript
// ❌ BAD: Long function with multiple responsibilities
async function createProjectWithSetup(input: any) {
  // Validate input (20 lines)
  if (!input.name) throw new Error('Name required');
  if (!input.startDate) throw new Error('Start date required');
  // ... more validation
  
  // Create project (10 lines)
  const project = await db.insert(projects).values(input);
  
  // Add members (15 lines)
  for (const member of input.members) {
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: member.userId,
      role: member.role,
    });
  }
  
  // Create default tasks (20 lines)
  const defaultTasks = ['Planning', 'Execution', 'Review'];
  for (const taskName of defaultTasks) {
    await db.insert(tasks).values({
      projectId: project.id,
      name: taskName,
      status: 'todo',
    });
  }
  
  // Send notifications (15 lines)
  for (const member of input.members) {
    await sendNotification({
      userId: member.userId,
      type: 'project_member_added',
      title: 'Added to project',
      content: `You have been added to ${input.name}`,
    });
  }
  
  return project;
}

// ✅ GOOD: Extracted into focused functions
async function validateProjectInput(input: any) {
  if (!input.name) throw new Error('Name required');
  if (!input.startDate) throw new Error('Start date required');
  // ... validation logic
}

async function addProjectMembers(projectId: number, members: any[]) {
  for (const member of members) {
    await db.insert(projectMembers).values({
      projectId,
      userId: member.userId,
      role: member.role,
    });
  }
}

async function createDefaultTasks(projectId: number) {
  const defaultTasks = ['Planning', 'Execution', 'Review'];
  await db.insert(tasks).values(
    defaultTasks.map(name => ({
      projectId,
      name,
      status: 'todo' as const,
    }))
  );
}

async function notifyProjectMembers(projectId: number, projectName: string, members: any[]) {
  await Promise.all(
    members.map(member =>
      sendNotification({
        userId: member.userId,
        type: 'project_member_added',
        title: 'Added to project',
        content: `You have been added to ${projectName}`,
      })
    )
  );
}

async function createProjectWithSetup(input: any) {
  validateProjectInput(input);
  const project = await db.insert(projects).values(input);
  
  await Promise.all([
    addProjectMembers(project.id, input.members),
    createDefaultTasks(project.id),
    notifyProjectMembers(project.id, input.name, input.members),
  ]);
  
  return project;
}
```

---

### Refactoring Pattern 2: Replace Conditional with Polymorphism

```typescript
// ❌ BAD: Complex switch statement
function calculateDefectPriority(defect: any) {
  switch (defect.type) {
    case 'CAR':
      if (defect.severity === 'critical') return 'urgent';
      if (defect.severity === 'high') return 'high';
      return 'medium';
    case 'PAR':
      if (defect.severity === 'critical') return 'high';
      return 'medium';
    case 'NCR':
      if (defect.ncrLevel === 'major') return 'urgent';
      return 'high';
    default:
      return 'low';
  }
}

// ✅ GOOD: Strategy pattern
interface DefectPriorityStrategy {
  calculate(defect: any): string;
}

class CARPriorityStrategy implements DefectPriorityStrategy {
  calculate(defect: any): string {
    const severityMap = {
      critical: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return severityMap[defect.severity] || 'medium';
  }
}

class PARPriorityStrategy implements DefectPriorityStrategy {
  calculate(defect: any): string {
    return defect.severity === 'critical' ? 'high' : 'medium';
  }
}

class NCRPriorityStrategy implements DefectPriorityStrategy {
  calculate(defect: any): string {
    return defect.ncrLevel === 'major' ? 'urgent' : 'high';
  }
}

const priorityStrategies: Record<string, DefectPriorityStrategy> = {
  CAR: new CARPriorityStrategy(),
  PAR: new PARPriorityStrategy(),
  NCR: new NCRPriorityStrategy(),
};

function calculateDefectPriority(defect: any): string {
  const strategy = priorityStrategies[defect.type];
  return strategy ? strategy.calculate(defect) : 'low';
}
```

---

## ⚡ Performance Optimization

### Database Optimization

#### 1. Use Indexes Wisely
```sql
-- ✅ GOOD: Index frequently queried columns
CREATE INDEX idx_tasks_projectId ON tasks(projectId);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigneeId ON tasks(assigneeId);
CREATE INDEX idx_defects_projectId_status ON defects(projectId, status);
```

#### 2. Limit Result Sets
```typescript
// ❌ BAD: Fetch all records
const allTasks = await db.select().from(tasks);

// ✅ GOOD: Use pagination
const tasks = await db
  .select()
  .from(tasks)
  .limit(20)
  .offset((page - 1) * 20);
```

#### 3. Select Only Needed Fields
```typescript
// ❌ BAD: Select all fields
const projects = await db.select().from(projects);

// ✅ GOOD: Select specific fields
const projects = await db
  .select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
  })
  .from(projects);
```

---

### Caching Strategy

```typescript
// ✅ GOOD: Cache expensive operations
import { LRUCache } from 'lru-cache';

const statsCache = new LRUCache<number, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function getProjectStats(projectId: number) {
  const cached = statsCache.get(projectId);
  if (cached) return cached;
  
  const stats = await calculateProjectStats(projectId);
  statsCache.set(projectId, stats);
  return stats;
}
```

---

### Connection Pooling

```typescript
// ✅ GOOD: Configure connection pool
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Adjust based on load
  queueLimit: 0,
  waitForConnections: true,
});

export const db = drizzle(pool);
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Query Performance**
   - Average query time
   - Slow queries (> 1s)
   - Query count per endpoint

2. **API Performance**
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate

3. **Database**
   - Connection pool utilization
   - Active connections
   - Deadlocks

4. **Application**
   - Memory usage
   - CPU usage
   - Error logs

---

## 🎯 Summary

### Quick Wins
1. ✅ Add indexes to frequently queried columns
2. ✅ Fix N+1 queries with JOINs
3. ✅ Add null checks with optional chaining
4. ✅ Implement consistent error handling
5. ✅ Add authorization checks to all mutations

### Medium Effort
1. 🔄 Migrate to repository pattern
2. 🔄 Implement caching strategy
3. 🔄 Add comprehensive validation
4. 🔄 Refactor large functions
5. 🔄 Add audit logging

### Long Term
1. 📅 Set up performance monitoring
2. 📅 Implement automated testing
3. 📅 Add rate limiting
4. 📅 Optimize database schema
5. 📅 Document all APIs

---

**Remember:** Always measure before and after optimization. Don't optimize prematurely!
