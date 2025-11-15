import { useAuth } from "@/_core/hooks/useAuth";
import { 
  ROLES, 
  PERMISSIONS, 
  hasPermission, 
  canEditDefect, 
  canDeleteDefect 
} from "@shared/permissions";
import type { User } from "../../../drizzle/schema";

/**
 * Hook to check user permissions in frontend
 * Usage: const { canCreate, canEdit, canDelete } = usePermissions('defects');
 */
export function usePermissions(resource: keyof typeof PERMISSIONS) {
  const { user } = useAuth();

  if (!user) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canAssignMembers: false,
      isOwner: false,
      isAdmin: false,
      isPM: false,
      isQC: false,
      isFieldEngineer: false,
    };
  }

  const role = user.role;

  return {
    canView: hasPermission(role, resource, 'view'),
    canCreate: hasPermission(role, resource, 'create'),
    canEdit: hasPermission(role, resource, 'edit'),
    canDelete: hasPermission(role, resource, 'delete'),
    canAssignMembers: hasPermission(role, resource, 'assignMembers'),
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isPM: role === 'project_manager',
    isQC: role === 'qc_inspector',
    isWorker: role === 'worker',
  };
}

/**
 * Hook to check if user can edit a specific defect
 */
export function useCanEditDefect(defect?: { reportedBy: number; assignedTo?: number | null } | null) {
  const { user } = useAuth();
  if (!user || !defect) return false;
  
  return canEditDefect(user.role, user.id, defect);
}

/**
 * Hook to check if user can delete defects
 */
export function useCanDeleteDefect() {
  const { user } = useAuth();
  if (!user) return false;
  
  return canDeleteDefect(user.role);
}

/**
 * Hook to get user role label in Thai
 */
export function useRoleLabel() {
  const { user } = useAuth();
  if (!user) return "";
  
  const roleLabels: Record<string, string> = {
    owner: "เจ้าของระบบ",
    admin: "ผู้ดูแลระบบ",
    project_manager: "ผู้จัดการโครงการ",
    qc_inspector: "QC Inspector",
    field_engineer: "วิศวกรสนาม",
    user: "ผู้ใช้ทั่วไป",
  };
  
  return roleLabels[user.role] || user.role;
}
