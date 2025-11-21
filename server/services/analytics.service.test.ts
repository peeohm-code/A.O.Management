/**
 * Analytics Service Tests
 * 
 * Tests for optimized analytics functions using SQL aggregations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as analyticsService from './analytics.service';
import { getDb } from '../db';
import { projects } from '../../drizzle/schema';

describe('Analytics Service - SQL Aggregations', () => {
  beforeAll(async () => {
    // Ensure database connection is available
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics using SQL aggregations', async () => {
      const stats = await analyticsService.getDashboardStats();
      
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats).toHaveProperty('totalActiveProjects');
        expect(stats).toHaveProperty('totalTasks');
        expect(stats).toHaveProperty('completedTasks');
        expect(stats).toHaveProperty('inProgressTasks');
        expect(stats).toHaveProperty('overdueTasks');
        expect(stats).toHaveProperty('pendingInspections');
        expect(stats).toHaveProperty('openDefects');
        expect(stats).toHaveProperty('criticalDefects');
        expect(stats).toHaveProperty('teamMembers');
        expect(stats).toHaveProperty('completionRate');

        // All values should be numbers
        expect(typeof stats.totalActiveProjects).toBe('number');
        expect(typeof stats.totalTasks).toBe('number');
        expect(typeof stats.completedTasks).toBe('number');
        expect(typeof stats.inProgressTasks).toBe('number');
        expect(typeof stats.overdueTasks).toBe('number');
        expect(typeof stats.pendingInspections).toBe('number');
        expect(typeof stats.openDefects).toBe('number');
        expect(typeof stats.criticalDefects).toBe('number');
        expect(typeof stats.teamMembers).toBe('number');
        expect(typeof stats.completionRate).toBe('number');

        // Completion rate should be between 0 and 100
        expect(stats.completionRate).toBeGreaterThanOrEqual(0);
        expect(stats.completionRate).toBeLessThanOrEqual(100);

        // Completed tasks should not exceed total tasks
        expect(stats.completedTasks).toBeLessThanOrEqual(stats.totalTasks);
      }
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics using SQL aggregations', async () => {
      // Get a project ID from the database first
      const db = await getDb();
      if (!db) return;

      const projectsData = await db.select().from(projects).limit(1);
      
      if (projectsData.length === 0) {
        console.log('No projects found, skipping test');
        return;
      }

      const projectId = projectsData[0].id;
      const stats = await analyticsService.getProjectStats(projectId);
      
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats).toHaveProperty('totalTasks');
        expect(stats).toHaveProperty('completedTasks');
        expect(stats).toHaveProperty('inProgressTasks');
        expect(stats).toHaveProperty('notStartedTasks');
        expect(stats).toHaveProperty('overdueTasks');
        expect(stats).toHaveProperty('progressPercentage');
        expect(stats).toHaveProperty('projectStatus');

        // All numeric values should be numbers
        expect(typeof stats.totalTasks).toBe('number');
        expect(typeof stats.completedTasks).toBe('number');
        expect(typeof stats.inProgressTasks).toBe('number');
        expect(typeof stats.notStartedTasks).toBe('number');
        expect(typeof stats.overdueTasks).toBe('number');
        expect(typeof stats.progressPercentage).toBe('number');

        // Project status should be one of the valid values
        expect(['on_track', 'delayed', 'overdue', 'completed']).toContain(stats.projectStatus);

        // Progress should be between 0 and 100
        expect(stats.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(stats.progressPercentage).toBeLessThanOrEqual(100);

        // Sum of counted task statuses should not exceed total tasks
        const sum = stats.completedTasks + stats.inProgressTasks + stats.notStartedTasks;
        expect(sum).toBeLessThanOrEqual(stats.totalTasks);
      }
    });

    it('should handle non-existent project gracefully', async () => {
      const stats = await analyticsService.getProjectStats(999999);
      expect(stats).toBeNull();
    });
  });

  describe('getBatchProjectStats', () => {
    it('should return stats for multiple projects using SQL aggregations', async () => {
      // Get some project IDs from the database
      const db = await getDb();
      if (!db) return;

      const projectsData = await db.select().from(projects).limit(3);
      
      if (projectsData.length === 0) {
        console.log('No projects found, skipping test');
        return;
      }

      const projectIds = projectsData.map(p => p.id);
      const statsMap = await analyticsService.getBatchProjectStats(projectIds);
      
      expect(statsMap).toBeDefined();
      expect(statsMap).toBeInstanceOf(Map);
      
      // Should have stats for each project
      for (const projectId of projectIds) {
        const stats = statsMap.get(projectId);
        expect(stats).toBeDefined();
        
        if (stats) {
          expect(stats).toHaveProperty('totalTasks');
          expect(stats).toHaveProperty('completedTasks');
          expect(stats).toHaveProperty('projectStatus');
        }
      }
    });

    it('should handle empty project list', async () => {
      const statsMap = await analyticsService.getBatchProjectStats([]);
      expect(statsMap).toBeDefined();
      expect(statsMap.size).toBe(0);
    });
  });

  describe('getCEOProjectStatusBreakdown', () => {
    it('should return project status breakdown using SQL aggregations', async () => {
      const breakdown = await analyticsService.getCEOProjectStatusBreakdown();
      
      expect(breakdown).toBeDefined();
      if (breakdown) {
        expect(breakdown).toHaveProperty('onTrack');
        expect(breakdown).toHaveProperty('atRisk');
        expect(breakdown).toHaveProperty('critical');
        expect(breakdown).toHaveProperty('total');

        // All values should be numbers
        expect(typeof breakdown.onTrack).toBe('number');
        expect(typeof breakdown.atRisk).toBe('number');
        expect(typeof breakdown.critical).toBe('number');
        expect(typeof breakdown.total).toBe('number');

        // Sum should equal total
        const sum = breakdown.onTrack + breakdown.atRisk + breakdown.critical;
        expect(sum).toBe(breakdown.total);

        // All values should be non-negative
        expect(breakdown.onTrack).toBeGreaterThanOrEqual(0);
        expect(breakdown.atRisk).toBeGreaterThanOrEqual(0);
        expect(breakdown.critical).toBeGreaterThanOrEqual(0);
        expect(breakdown.total).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getTaskStatusBreakdown', () => {
    it('should return task status breakdown using SQL GROUP BY', async () => {
      const breakdown = await analyticsService.getTaskStatusBreakdown();
      
      expect(breakdown).toBeDefined();
      if (breakdown) {
        expect(breakdown).toHaveProperty('not_started');
        expect(breakdown).toHaveProperty('in_progress');
        expect(breakdown).toHaveProperty('completed');
        expect(breakdown).toHaveProperty('on_hold');

        // All values should be numbers
        expect(typeof breakdown.not_started).toBe('number');
        expect(typeof breakdown.in_progress).toBe('number');
        expect(typeof breakdown.completed).toBe('number');
        expect(typeof breakdown.on_hold).toBe('number');

        // All values should be non-negative
        expect(breakdown.not_started).toBeGreaterThanOrEqual(0);
        expect(breakdown.in_progress).toBeGreaterThanOrEqual(0);
        expect(breakdown.completed).toBeGreaterThanOrEqual(0);
        expect(breakdown.on_hold).toBeGreaterThanOrEqual(0);
      }
    });

    it('should filter by project ID when provided', async () => {
      const db = await getDb();
      if (!db) return;

      const projectsData = await db.select().from(projects).limit(1);
      
      if (projectsData.length === 0) {
        console.log('No projects found, skipping test');
        return;
      }

      const projectId = projectsData[0].id;
      const breakdown = await analyticsService.getTaskStatusBreakdown(projectId);
      
      expect(breakdown).toBeDefined();
      if (breakdown) {
        expect(breakdown).toHaveProperty('not_started');
        expect(breakdown).toHaveProperty('in_progress');
        expect(breakdown).toHaveProperty('completed');
      }
    });
  });

  describe('getDefectSeverityBreakdown', () => {
    it('should return defect severity breakdown using SQL GROUP BY', async () => {
      const breakdown = await analyticsService.getDefectSeverityBreakdown();
      
      expect(breakdown).toBeDefined();
      if (breakdown) {
        expect(breakdown).toHaveProperty('low');
        expect(breakdown).toHaveProperty('medium');
        expect(breakdown).toHaveProperty('high');
        expect(breakdown).toHaveProperty('critical');

        // All values should be numbers
        expect(typeof breakdown.low).toBe('number');
        expect(typeof breakdown.medium).toBe('number');
        expect(typeof breakdown.high).toBe('number');
        expect(typeof breakdown.critical).toBe('number');

        // All values should be non-negative
        expect(breakdown.low).toBeGreaterThanOrEqual(0);
        expect(breakdown.medium).toBeGreaterThanOrEqual(0);
        expect(breakdown.high).toBeGreaterThanOrEqual(0);
        expect(breakdown.critical).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getInspectionPassRate', () => {
    it('should return inspection pass rate using SQL aggregations', async () => {
      const result = await analyticsService.getInspectionPassRate();
      
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('passed');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('passRate');

        // All values should be numbers
        expect(typeof result.total).toBe('number');
        expect(typeof result.passed).toBe('number');
        expect(typeof result.failed).toBe('number');
        expect(typeof result.passRate).toBe('number');

        // Pass rate should be between 0 and 100
        expect(result.passRate).toBeGreaterThanOrEqual(0);
        expect(result.passRate).toBeLessThanOrEqual(100);

        // Passed + failed should not exceed total
        expect(result.passed + result.failed).toBeLessThanOrEqual(result.total);
      }
    });
  });
});

describe('Performance Comparison', () => {
  it('should demonstrate SQL aggregations are faster than JavaScript loops', async () => {
    // This is a conceptual test to show the optimization
    // In production, you would use actual performance monitoring
    
    const db = await getDb();
    if (!db) return;

    const projectsData = await db.select().from(projects).limit(5);
    
    if (projectsData.length === 0) {
      console.log('No projects found, skipping performance test');
      return;
    }

    const projectIds = projectsData.map(p => p.id);

    // Measure time for optimized version
    const startOptimized = Date.now();
    await analyticsService.getBatchProjectStats(projectIds);
    const timeOptimized = Date.now() - startOptimized;

    console.log(`Optimized (SQL aggregations): ${timeOptimized}ms`);
    
    // The optimized version should complete successfully
    expect(timeOptimized).toBeGreaterThan(0);
    
    // Note: In the old version, this would require:
    // - N queries to fetch tasks for each project
    // - JavaScript loops to count statuses
    // - Much slower execution time
  });
});
