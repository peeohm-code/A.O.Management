/**
 * Repository Facade
 * 
 * Provides a unified interface to all repositories.
 * This facade allows gradual migration from db.ts to repository pattern
 * without breaking existing router code.
 */

import { UserRepository } from './user.repository';
import { ProjectRepository } from './project.repository';
import { TaskRepository } from './task.repository';
import { DefectRepository } from './defect.repository';
import { InspectionRepository } from './inspection.repository';
import { NotificationRepository } from './notification.repository';
import { TemplateRepository } from './template.repository';
import { AnalyticsRepository } from './analytics.repository';
import { MiscRepository } from './misc.repository';
import { getDb } from '../db';

/**
 * Repository Facade Class
 * 
 * Singleton that provides access to all repositories
 */
class RepositoryFacade {
  private static instance: RepositoryFacade;
  
  // Repository instances
  public readonly user: UserRepository;
  public readonly project: ProjectRepository;
  public readonly task: TaskRepository;
  public readonly defect: DefectRepository;
  public readonly inspection: InspectionRepository;
  public readonly notification: NotificationRepository;
  public readonly template: TemplateRepository;
  public readonly analytics: AnalyticsRepository;
  public readonly misc: MiscRepository;
  
  private constructor() {
    // Get database instance (will be null if not available)
    const db = null; // Repositories will call getDb() internally
    
    // Initialize all repositories
    this.user = new UserRepository(db);
    this.project = new ProjectRepository(db);
    this.task = new TaskRepository(db);
    this.defect = new DefectRepository(db);
    this.inspection = new InspectionRepository(db);
    this.notification = new NotificationRepository(db);
    this.template = new TemplateRepository(db);
    this.analytics = new AnalyticsRepository(db);
    this.misc = new MiscRepository(db);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RepositoryFacade {
    if (!RepositoryFacade.instance) {
      RepositoryFacade.instance = new RepositoryFacade();
    }
    return RepositoryFacade.instance;
  }
}

/**
 * Export singleton instance
 */
export const repositories = RepositoryFacade.getInstance();

/**
 * Export individual repositories for direct access
 */
export const {
  user: userRepository,
  project: projectRepository,
  task: taskRepository,
  defect: defectRepository,
  inspection: inspectionRepository,
  notification: notificationRepository,
  template: templateRepository,
  analytics: analyticsRepository,
  misc: miscRepository,
} = repositories;
