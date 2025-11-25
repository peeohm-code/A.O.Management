/**
 * Repository Layer Index
 * 
 * Central export point for all repositories.
 */

// Export repository classes
export { BaseRepository } from './base.repository';
export { UserRepository } from './user.repository';
export { ProjectRepository } from './project.repository';
export { TaskRepository } from './task.repository';
export { DefectRepository } from './defect.repository';
export { InspectionRepository } from './inspection.repository';
export { NotificationRepository } from './notification.repository';
export { TemplateRepository } from './template.repository';
export { AnalyticsRepository } from './analytics.repository';
export { MiscRepository } from './misc.repository';

// Export facade for unified access
export { repositories, projectRepository, taskRepository, defectRepository, userRepository, notificationRepository, templateRepository, inspectionRepository, analyticsRepository, miscRepository } from './facade';
