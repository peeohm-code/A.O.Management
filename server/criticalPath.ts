/**
 * Critical Path Method (CPM) Algorithm
 * Calculates the critical path and slack times for project tasks
 */

interface Task {
  id: number;
  startDate: Date;
  endDate: Date;
  dependencies: Array<{ dependsOnTaskId: number; type: string }>;
}

interface CPMResult {
  criticalPath: number[]; // Task IDs on critical path
  taskMetrics: Map<number, {
    earlyStart: Date;
    earlyFinish: Date;
    lateStart: Date;
    lateFinish: Date;
    totalFloat: number; // in days
    isCritical: boolean;
  }>;
  projectDuration: number; // in days
}

/**
 * Calculate the critical path for a set of tasks
 */
export function calculateCriticalPath(tasks: Task[]): CPMResult {
  if (tasks.length === 0) {
    return {
      criticalPath: [],
      taskMetrics: new Map(),
      projectDuration: 0,
    };
  }

  const taskMap = new Map<number, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  const taskMetrics = new Map<number, {
    earlyStart: Date;
    earlyFinish: Date;
    lateStart: Date;
    lateFinish: Date;
    totalFloat: number;
    isCritical: boolean;
  }>();

  // Step 1: Forward pass - Calculate Early Start and Early Finish
  const visited = new Set<number>();
  const calculateEarlyDates = (taskId: number): void => {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (!task) return;

    const finishToStartDeps = task.dependencies.filter(d => d.type === 'finish_to_start');
    
    let earlyStart: Date;
    if (finishToStartDeps.length === 0) {
      // No dependencies, use task's start date
      earlyStart = new Date(task.startDate);
    } else {
      // Calculate based on predecessors
      const predecessorFinishes: Date[] = [];
      for (const dep of finishToStartDeps) {
        calculateEarlyDates(dep.dependsOnTaskId);
        const predMetrics = taskMetrics.get(dep.dependsOnTaskId);
        if (predMetrics) {
          predecessorFinishes.push(predMetrics.earlyFinish);
        }
      }
      earlyStart = predecessorFinishes.length > 0
        ? new Date(Math.max(...predecessorFinishes.map(d => d.getTime())))
        : new Date(task.startDate);
    }

    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const earlyFinish = new Date(earlyStart.getTime() + duration * 24 * 60 * 60 * 1000);

    taskMetrics.set(taskId, {
      earlyStart,
      earlyFinish,
      lateStart: new Date(0),
      lateFinish: new Date(0),
      totalFloat: 0,
      isCritical: false,
    });
  };

  // Calculate early dates for all tasks
  tasks.forEach(task => calculateEarlyDates(task.id));

  // Find project end date (maximum early finish)
  let projectEnd = new Date(0);
  taskMetrics.forEach(metrics => {
    if (metrics.earlyFinish > projectEnd) {
      projectEnd = metrics.earlyFinish;
    }
  });

  // Step 2: Backward pass - Calculate Late Start and Late Finish
  const calculateLateDates = (taskId: number): void => {
    const task = taskMap.get(taskId);
    if (!task) return;

    const metrics = taskMetrics.get(taskId);
    if (!metrics) return;

    // Find tasks that depend on this task
    const successors = tasks.filter(t => 
      t.dependencies.some(d => d.dependsOnTaskId === taskId && d.type === 'finish_to_start')
    );

    let lateFinish: Date;
    if (successors.length === 0) {
      // No successors, use project end
      lateFinish = projectEnd;
    } else {
      // Calculate based on successors
      const successorStarts: Date[] = [];
      for (const successor of successors) {
        calculateLateDates(successor.id);
        const succMetrics = taskMetrics.get(successor.id);
        if (succMetrics) {
          successorStarts.push(succMetrics.lateStart);
        }
      }
      lateFinish = successorStarts.length > 0
        ? new Date(Math.min(...successorStarts.map(d => d.getTime())))
        : projectEnd;
    }

    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateStart = new Date(lateFinish.getTime() - duration * 24 * 60 * 60 * 1000);

    metrics.lateStart = lateStart;
    metrics.lateFinish = lateFinish;
    metrics.totalFloat = Math.round((lateStart.getTime() - metrics.earlyStart.getTime()) / (1000 * 60 * 60 * 24));
    metrics.isCritical = metrics.totalFloat === 0;
  };

  // Calculate late dates for all tasks (in reverse order)
  const reverseTasks = [...tasks].reverse();
  reverseTasks.forEach(task => calculateLateDates(task.id));

  // Step 3: Identify critical path
  const criticalPath: number[] = [];
  taskMetrics.forEach((metrics, taskId) => {
    if (metrics.isCritical) {
      criticalPath.push(taskId);
    }
  });

  // Calculate project duration
  const projectStart = new Date(Math.min(...tasks.map(t => t.startDate.getTime())));
  const projectDuration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

  return {
    criticalPath,
    taskMetrics,
    projectDuration,
  };
}
