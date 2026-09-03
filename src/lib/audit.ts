// ============================================================
// Audit Logger — Admin Action Trail
// ============================================================
// Automatically logs admin write/delete actions to the audit_logs table.
// Call logAudit() from every admin API route that mutates data.
// ============================================================

import { db } from '@/lib/db';

export type AuditAction =
  | 'USER_CREATE'
  | 'USER_DELETE'
  | 'USER_TIER_CHANGE'
  | 'USER_STATUS_CHANGE'
  | 'USER_ADMIN_TOGGLE'
  | 'USER_GRACE_PERIOD'
  | 'USER_PASSWORD_RESET'
  | 'ROOM_CLOSE'
  | 'ROOM_OPEN'
  | 'ROOM_DELETE'
  | 'ROOM_FORCE_END'
  | 'SUBSCRIPTION_OVERRIDE'
  | 'SUBSCRIPTION_CANCEL'
  | 'SUBSCRIPTION_EXTEND'
  | 'PLATFORM_MAINTENANCE_TOGGLE'
  | 'PLATFORM_ANNOUNCEMENT_CHANGE'
  | 'BULK_TIER_CHANGE';

/**
 * Log an admin action to the audit trail.
 * @param adminId — The admin user's ID performing the action
 * @param action — The type of action (use AuditAction enum values)
 * @param targetType — Optional type of target (e.g., "User", "Room")
 * @param targetId — Optional ID of the affected resource
 * @param metadata — Optional JSON-serializable object with change details
 */
export async function logAudit(
  adminId: string,
  action: AuditAction | string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: adminId,
        action,
        target: targetId || null,
        details: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (error) {
    // Audit logging should never block the main operation
    console.error('[AuditLog] Failed to write audit entry:', error);
  }
}
