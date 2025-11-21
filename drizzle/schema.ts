import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, varchar, text, timestamp, mysqlEnum, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const activityLog = mysqlTable("activityLog", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	projectId: int(),
	taskId: int(),
	action: varchar({ length: 100 }).notNull(),
	details: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userIdx").on(table.userId),
	index("projectIdx").on(table.projectId),
	index("taskIdx").on(table.taskId),
	index("actionIdx").on(table.action),
	index("createdAtIdx").on(table.createdAt),
]);

export const alertThresholds = mysqlTable("alertThresholds", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	metricType: mysqlEnum(['cpu','memory']).notNull(),
	threshold: int().notNull(),
	isEnabled: tinyint().default(1).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userMetricIdx").on(table.userId, table.metricType),
]);

export const approvalSteps = mysqlTable("approvalSteps", {
	id: int().autoincrement().notNull(),
	approvalId: int().notNull(),
	approverId: int().notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	comments: text(),
	signatureData: text(),
	approvedAt: timestamp(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("approvalIdx").on(table.approvalId),
	index("approverIdx").on(table.approverId),
]);

export const approvals = mysqlTable("approvals", {
	id: int().autoincrement().notNull(),
	entityType: mysqlEnum(['defect','checklist']).notNull(),
	entityId: int().notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("entityIdx").on(table.entityType, table.entityId),
]);

export const archiveHistory = mysqlTable("archiveHistory", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	action: mysqlEnum(['archived','unarchived']).notNull(),
	performedBy: int().notNull(),
	reason: text(),
	ruleId: int(),
	performedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectIdIdx").on(table.projectId),
	index("performedAtIdx").on(table.performedAt),
]);

export const archiveRules = mysqlTable("archiveRules", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	enabled: tinyint().default(1).notNull(),
	projectStatus: mysqlEnum(['planning','active','on_hold','completed','cancelled']),
	daysAfterCompletion: int(),
	daysAfterEndDate: int(),
	createdBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
	lastRunAt: timestamp(),
});

export const categoryColors = mysqlTable("categoryColors", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	category: mysqlEnum(['preparation','structure','architecture','mep','other']).notNull(),
	color: varchar({ length: 7 }).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectCategoryIdx").on(table.projectId, table.category),
]);

export const checklistItemResults = mysqlTable("checklistItemResults", {
	id: int().autoincrement().notNull(),
	taskChecklistId: int().notNull(),
	templateItemId: int().notNull(),
	result: mysqlEnum(['pass','fail','na']).notNull(),
	photoUrls: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("checklistIdx").on(table.taskChecklistId),
]);

export const checklistResults = mysqlTable("checklistResults", {
	id: int().autoincrement().notNull(),
	checklistId: int().notNull(),
	itemId: int().notNull(),
	result: mysqlEnum(['pass','fail','na']).notNull(),
	comment: text(),
	photoUrls: text(),
	inspectedBy: int().notNull(),
	inspectedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("checklistIdx").on(table.checklistId),
	index("itemIdx").on(table.itemId),
]);

export const checklistTemplateItems = mysqlTable("checklistTemplateItems", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull(),
	itemText: text().notNull(),
	order: int().default(0).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("templateIdx").on(table.templateId),
]);

export const checklistTemplates = mysqlTable("checklistTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 100 }),
	stage: mysqlEnum(['pre_execution','in_progress','post_execution']).notNull(),
	description: text(),
	allowGeneralComments: tinyint().default(1).notNull(),
	allowPhotos: tinyint().default(1).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("categoryIdx").on(table.category),
	index("stageIdx").on(table.stage),
]);

export const dbStatistics = mysqlTable("dbStatistics", {
	id: int().autoincrement().notNull(),
	tableName: varchar({ length: 100 }).notNull(),
	rowCount: int().notNull(),
	dataSize: int().notNull(),
	indexSize: int().notNull(),
	avgQueryTime: int(),
	queryCount: int().default(0).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("tableNameIdx").on(table.tableName),
	index("createdAtIdx").on(table.createdAt),
]);

export const defectAttachments = mysqlTable("defectAttachments", {
	id: int().autoincrement().notNull(),
	defectId: int().notNull(),
	fileUrl: varchar({ length: 500 }).notNull(),
	fileKey: varchar({ length: 500 }).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileType: varchar({ length: 100 }).notNull(),
	fileSize: int().notNull(),
	attachmentType: mysqlEnum(['before','after','supporting']).notNull(),
	uploadedBy: int().notNull(),
	uploadedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("defectIdx").on(table.defectId),
	index("typeIdx").on(table.attachmentType),
]);

export const defectInspections = mysqlTable("defect_inspections", {
	id: int().autoincrement().notNull(),
	defectId: int().notNull(),
	inspectorId: int().notNull(),
	inspectionType: varchar({ length: 20 }).notNull(),
	result: varchar({ length: 20 }).default('pending').notNull(),
	comments: text(),
	photoUrls: text(),
	inspectedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("defectIdx").on(table.defectId),
	index("inspectorIdx").on(table.inspectorId),
	index("typeIdx").on(table.inspectionType),
]);

export const defects = mysqlTable("defects", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	checklistItemResultId: int(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	photoUrls: text(),
	status: mysqlEnum(['reported','analysis','in_progress','resolved','pending_reinspection','closed']).default('reported').notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	assignedTo: int(),
	reportedBy: int().notNull(),
	resolvedBy: int(),
	resolvedAt: timestamp(),
	resolutionPhotoUrls: text(),
	resolutionComment: text(),
	type: mysqlEnum(['CAR','PAR','NCR']).default('CAR').notNull(),
	checklistId: int(),
	rootCause: text(),
	correctiveAction: text(),
	preventiveAction: text(),
	dueDate: timestamp(),
	actionMethod: text(),
	actionResponsible: varchar({ length: 255 }),
	actionDeadline: timestamp(),
	actionNotes: text(),
	ncrLevel: mysqlEnum(['major','minor']),
	verifiedBy: int(),
	verifiedAt: timestamp(),
	verificationComment: text(),
	resolutionNotes: text(),
	implementationMethod: text(),
	beforePhotos: text(),
	afterPhotos: text(),
	closureNotes: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
	escalation: text(),
},
(table) => [
	index("taskIdx").on(table.taskId),
	index("statusIdx").on(table.status),
	index("assignedToIdx").on(table.assignedTo),
	index("typeIdx").on(table.type),
	index("checklistIdx").on(table.checklistId),
]);

export const memoryLogs = mysqlTable("memoryLogs", {
	id: int().autoincrement().notNull(),
	timestamp: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	totalMemoryMb: int().notNull(),
	usedMemoryMb: int().notNull(),
	freeMemoryMb: int().notNull(),
	usagePercentage: int().notNull(),
	buffersCacheMb: int(),
	availableMemoryMb: int(),
	swapTotalMb: int(),
	swapUsedMb: int(),
	swapFreePercentage: int(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("timestampIdx").on(table.timestamp),
	index("usagePercentageIdx").on(table.usagePercentage),
]);

export const notificationSettings = mysqlTable("notificationSettings", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	enableTaskDeadlineReminders: tinyint().default(1).notNull(),
	taskDeadlineDaysAdvance: int().default(3).notNull(),
	enableDefectOverdueReminders: tinyint().default(1).notNull(),
	defectOverdueDaysThreshold: int().default(7).notNull(),
	enableDailySummary: tinyint().default(0).notNull(),
	dailySummaryTime: varchar({ length: 5 }).default('08:00'),
	enableInAppNotifications: tinyint().default(1).notNull(),
	enableEmailNotifications: tinyint().default(1).notNull(),
	enablePushNotifications: tinyint().default(1).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationSettings_userId_unique").on(table.userId),
	index("userIdx").on(table.userId),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	type: mysqlEnum(['task_assigned','task_status_changed','task_deadline_approaching','task_overdue','task_progress_updated','task_comment_mention','inspection_requested','inspection_completed','inspection_passed','inspection_failed','checklist_assigned','checklist_reminder','reinspection_required','defect_assigned','defect_created','defect_status_changed','defect_resolved','defect_reinspected','defect_deadline_approaching','project_member_added','project_milestone_reached','project_status_changed','file_uploaded','comment_added','dependency_blocked','comment_mention','task_updated','deadline_reminder','system_health_warning','system_health_critical','system_health_info']).notNull(),
	priority: mysqlEnum(['urgent','high','normal','low']).default('normal').notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	relatedTaskId: int(),
	relatedProjectId: int(),
	relatedDefectId: int(),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userIdx").on(table.userId),
	index("isReadIdx").on(table.isRead),
	index("typeIdx").on(table.type),
	index("relatedTaskIdx").on(table.relatedTaskId),
	index("relatedProjectIdx").on(table.relatedProjectId),
	index("createdAtIdx").on(table.createdAt),
]);

export const oomEvents = mysqlTable("oomEvents", {
	id: int().autoincrement().notNull(),
	timestamp: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	processName: varchar({ length: 255 }),
	processId: int(),
	killedProcessName: varchar({ length: 255 }),
	killedProcessId: int(),
	memoryUsedMb: int(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	logMessage: text(),
	resolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp(),
	resolvedBy: int(),
	resolutionNotes: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("timestampIdx").on(table.timestamp),
	index("severityIdx").on(table.severity),
	index("resolvedIdx").on(table.resolved),
]);

export const projectMembers = mysqlTable("projectMembers", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	userId: int().notNull(),
	role: mysqlEnum(['project_manager','qc_inspector','worker']).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectUserIdx").on(table.projectId, table.userId),
]);

export const projects = mysqlTable("projects", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 100 }),
	location: text(),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	ownerName: varchar({ length: 255 }),
	startDate: varchar({ length: 10 }),
	endDate: varchar({ length: 10 }),
	budget: int(),
	status: mysqlEnum(['draft','planning','active','on_hold','completed','cancelled']).default('draft').notNull(),
	completionPercentage: int().default(0),
	color: varchar({ length: 7 }).default('#3B82F6'),
	createdBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
	archivedAt: timestamp(),
	archivedBy: int(),
	archivedReason: text(),
},
(table) => [
	index("createdByIdx").on(table.createdBy),
	index("archivedAtIdx").on(table.archivedAt),
]);

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	userAgent: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	lastUsedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userIdx").on(table.userId),
]);

export const qcChecklistItems = mysqlTable("qc_checklist_items", {
	id: int().autoincrement().notNull(),
	checklistId: int().notNull(),
	itemText: text().notNull(),
	orderIndex: int().default(0).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const qcChecklists = mysqlTable("qc_checklists", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	isTemplate: tinyint().default(1).notNull(),
	projectId: int(),
	createdBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const qcInspectionResults = mysqlTable("qc_inspection_results", {
	id: int().autoincrement().notNull(),
	inspectionId: int().notNull(),
	checklistItemId: int().notNull(),
	result: mysqlEnum(['pass','fail','na']).notNull(),
	remarks: text(),
	photoUrl: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const qcInspections = mysqlTable("qc_inspections", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	checklistId: int().notNull(),
	taskId: int(),
	inspectionDate: timestamp().notNull(),
	inspectorId: int().notNull(),
	location: text(),
	status: mysqlEnum(['pending','in_progress','completed','failed']).default('pending').notNull(),
	overallResult: mysqlEnum(['pass','fail','conditional']),
	notes: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const queryLogs = mysqlTable("queryLogs", {
	id: int().autoincrement().notNull(),
	queryText: text().notNull(),
	executionTime: int().notNull(),
	tableName: varchar({ length: 100 }),
	operationType: mysqlEnum(['SELECT','INSERT','UPDATE','DELETE','OTHER']).notNull(),
	userId: int(),
	endpoint: varchar({ length: 255 }),
	errorMessage: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const scheduledNotifications = mysqlTable("scheduledNotifications", {
	id: int().autoincrement().notNull(),
	type: mysqlEnum(['task_deadline_reminder','defect_overdue_reminder','inspection_reminder','daily_summary']).notNull(),
	userId: int().notNull(),
	relatedTaskId: int(),
	relatedDefectId: int(),
	relatedProjectId: int(),
	scheduledFor: timestamp().notNull(),
	status: mysqlEnum(['pending','sent','failed','cancelled']).default('pending').notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	priority: mysqlEnum(['urgent','high','normal','low']).default('normal').notNull(),
	sentAt: timestamp(),
	errorMessage: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const signatures = mysqlTable("signatures", {
	id: int().autoincrement().notNull(),
	checklistId: int().notNull(),
	signatureData: text().notNull(),
	signedBy: int().notNull(),
	signedAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const systemLogs = mysqlTable("systemLogs", {
	id: int().autoincrement().notNull(),
	type: mysqlEnum(['error','warning','info','performance','security']).notNull(),
	category: varchar({ length: 100 }).notNull(),
	message: text().notNull(),
	details: text(),
	severity: mysqlEnum(['low','medium','high','critical']).default('low').notNull(),
	userId: int(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	resolved: tinyint().default(0).notNull(),
	resolvedBy: int(),
	resolvedAt: timestamp(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const taskAssignments = mysqlTable("taskAssignments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	userId: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const taskAttachments = mysqlTable("taskAttachments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileKey: varchar({ length: 500 }).notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	uploadedBy: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const taskChecklists = mysqlTable("taskChecklists", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	templateId: int().notNull(),
	stage: mysqlEnum(['pre_execution','in_progress','post_execution']).notNull(),
	status: mysqlEnum(['not_started','pending_inspection','in_progress','completed','failed']).default('not_started').notNull(),
	inspectedBy: int(),
	inspectedAt: timestamp(),
	generalComments: text(),
	photoUrls: text(),
	signature: text(),
	originalInspectionId: int(),
	reinspectionCount: int().default(0).notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const taskComments = mysqlTable("taskComments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	userId: int().notNull(),
	content: text().notNull(),
	mentions: text(),
	attachmentUrls: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const taskDependencies = mysqlTable("taskDependencies", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	dependsOnTaskId: int().notNull(),
	type: mysqlEnum(['finish_to_start','start_to_start','finish_to_finish']).default('finish_to_start').notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const taskFollowers = mysqlTable("taskFollowers", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	userId: int().notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
});

export const tasks = mysqlTable("tasks", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	parentTaskId: int(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: varchar({ length: 10 }),
	endDate: varchar({ length: 10 }),
	progress: int().default(0).notNull(),
	status: mysqlEnum(['todo','pending_pre_inspection','ready_to_start','in_progress','pending_final_inspection','rectification_needed','completed','not_started','delayed']).default('todo').notNull(),
	assigneeId: int(),
	category: varchar({ length: 50 }),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	order: int().default(0).notNull(),
	photoUrls: text(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
	escalation: text(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['owner','admin','project_manager','qc_inspector','worker']).default('worker').notNull(),
	createdAt: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp().default('CURRENT_TIMESTAMP').notNull(),
	notificationDaysAdvance: int().default(3).notNull(),
	enableInAppNotifications: tinyint().default(1).notNull(),
	enableEmailNotifications: tinyint().default(1).notNull(),
	enableDailySummaryEmail: tinyint().default(0).notNull(),
	dailySummaryTime: varchar({ length: 5 }).default('08:00'),
},
(table) => [
	index("openId").on(table.openId),
]);
