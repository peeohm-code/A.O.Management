import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('[Seed] Starting role templates seeding...');

try {
  // Get all permissions first
  const [permissions] = await connection.execute('SELECT * FROM permissions');
  console.log(`[Seed] Found ${permissions.length} permissions`);

  // Get owner user ID
  const [owners] = await connection.execute('SELECT id FROM users WHERE role = ? LIMIT 1', ['owner']);
  const ownerId = owners[0]?.id || 1;

  // Define default templates with their permissions
  const templates = [
    {
      name: 'Project Manager (Standard)',
      roleType: 'project_manager',
      description: 'Standard permissions for project managers - full access to projects, tasks, and team management',
      isDefault: true,
      permissions: [
        // Projects - full access
        { module: 'projects', action: 'view' },
        { module: 'projects', action: 'create' },
        { module: 'projects', action: 'edit' },
        { module: 'projects', action: 'delete' },
        // Tasks - full access
        { module: 'tasks', action: 'view' },
        { module: 'tasks', action: 'create' },
        { module: 'tasks', action: 'edit' },
        { module: 'tasks', action: 'delete' },
        // Inspections - view and create
        { module: 'inspections', action: 'view' },
        { module: 'inspections', action: 'create' },
        // Defects - view and create
        { module: 'defects', action: 'view' },
        { module: 'defects', action: 'create' },
        // Reports - full access
        { module: 'reports', action: 'view' },
        { module: 'reports', action: 'create' },
        // Dashboard - view
        { module: 'dashboard', action: 'view' },
        // Settings - view
        { module: 'settings', action: 'view' },
      ],
    },
    {
      name: 'QC Inspector (Standard)',
      roleType: 'qc_inspector',
      description: 'Standard permissions for QC inspectors - focus on inspections and defect management',
      isDefault: true,
      permissions: [
        // Projects - view only
        { module: 'projects', action: 'view' },
        // Tasks - view only
        { module: 'tasks', action: 'view' },
        // Inspections - full access
        { module: 'inspections', action: 'view' },
        { module: 'inspections', action: 'create' },
        { module: 'inspections', action: 'edit' },
        // Defects - full access
        { module: 'defects', action: 'view' },
        { module: 'defects', action: 'create' },
        { module: 'defects', action: 'edit' },
        { module: 'defects', action: 'delete' },
        // Reports - view and create
        { module: 'reports', action: 'view' },
        { module: 'reports', action: 'create' },
        // Dashboard - view
        { module: 'dashboard', action: 'view' },
      ],
    },
    {
      name: 'Worker (Standard)',
      roleType: 'worker',
      description: 'Standard permissions for workers - view assigned tasks and update progress',
      isDefault: true,
      permissions: [
        // Projects - view only
        { module: 'projects', action: 'view' },
        // Tasks - view and edit (own tasks)
        { module: 'tasks', action: 'view' },
        { module: 'tasks', action: 'edit' },
        // Inspections - view only
        { module: 'inspections', action: 'view' },
        // Defects - view only
        { module: 'defects', action: 'view' },
        // Dashboard - view
        { module: 'dashboard', action: 'view' },
      ],
    },
    {
      name: 'Project Manager (Limited)',
      roleType: 'project_manager',
      description: 'Limited permissions for project managers - cannot delete projects or tasks',
      isDefault: false,
      permissions: [
        // Projects - no delete
        { module: 'projects', action: 'view' },
        { module: 'projects', action: 'create' },
        { module: 'projects', action: 'edit' },
        // Tasks - no delete
        { module: 'tasks', action: 'view' },
        { module: 'tasks', action: 'create' },
        { module: 'tasks', action: 'edit' },
        // Inspections - view and create
        { module: 'inspections', action: 'view' },
        { module: 'inspections', action: 'create' },
        // Defects - view and create
        { module: 'defects', action: 'view' },
        { module: 'defects', action: 'create' },
        // Reports - view and create
        { module: 'reports', action: 'view' },
        { module: 'reports', action: 'create' },
        // Dashboard - view
        { module: 'dashboard', action: 'view' },
      ],
    },
    {
      name: 'QC Inspector (Read-Only)',
      roleType: 'qc_inspector',
      description: 'Read-only permissions for QC inspectors - can view but not modify',
      isDefault: false,
      permissions: [
        // Projects - view only
        { module: 'projects', action: 'view' },
        // Tasks - view only
        { module: 'tasks', action: 'view' },
        // Inspections - view only
        { module: 'inspections', action: 'view' },
        // Defects - view only
        { module: 'defects', action: 'view' },
        // Reports - view only
        { module: 'reports', action: 'view' },
        // Dashboard - view
        { module: 'dashboard', action: 'view' },
      ],
    },
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const template of templates) {
    // Check if template already exists
    const [existing] = await connection.execute(
      'SELECT id FROM roleTemplates WHERE name = ? AND roleType = ?',
      [template.name, template.roleType]
    );

    if (existing.length > 0) {
      console.log(`[Seed] Template "${template.name}" already exists, skipping...`);
      skipCount++;
      continue;
    }

    // If this is a default template, unset other defaults for the same role type
    if (template.isDefault) {
      await connection.execute(
        'UPDATE roleTemplates SET isDefault = false WHERE roleType = ?',
        [template.roleType]
      );
    }

    // Insert template
    const [result] = await connection.execute(
      'INSERT INTO roleTemplates (name, roleType, description, isDefault, createdBy) VALUES (?, ?, ?, ?, ?)',
      [template.name, template.roleType, template.description, template.isDefault, ownerId]
    );

    const templateId = result.insertId;

    // Insert permissions
    for (const perm of template.permissions) {
      // Find permission ID
      const permission = permissions.find(
        p => p.module === perm.module && p.action === perm.action
      );

      if (permission) {
        await connection.execute(
          'INSERT INTO roleTemplatePermissions (roleTemplateId, permissionId) VALUES (?, ?)',
          [templateId, permission.id]
        );
      } else {
        console.warn(`[Seed] Permission not found: ${perm.module}.${perm.action}`);
      }
    }

    console.log(`[Seed] Created template: ${template.name} (${template.permissions.length} permissions)`);
    successCount++;
  }

  console.log(`[Seed] Seeding completed: ${successCount} created, ${skipCount} skipped`);
} catch (error) {
  console.error('[Seed] Error:', error);
  process.exit(1);
} finally {
  await connection.end();
}
