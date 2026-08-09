// Role-based access control definitions
export const ROLES = {
  ADMIN: 'admin',
  AGENCY_OWNER: 'agency_owner',
  SUB_TUTOR: 'sub_tutor',
  TUTOR: 'tutor',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Permission definitions — what each role can do
export const PERMISSIONS = {
  // Room management
  CREATE_ROOM: 'room:create',
  END_ROOM: 'room:end',

  // Whiteboard
  DRAW: 'whiteboard:draw',
  USE_TOOLS: 'whiteboard:tools',
  MANAGE_PAGES: 'whiteboard:pages',

  // AI features
  USE_AI: 'ai:use',
  VIEW_ANSWER_KEY: 'ai:answer_key',

  // Recording
  START_RECORDING: 'recording:start',
  VIEW_RECORDINGS: 'recording:view',

  // Agency management
  MANAGE_STUDENTS: 'agency:students',
  MANAGE_SUBTUTORS: 'agency:subtutors',
  VIEW_AGENCY_ANALYTICS: 'agency:analytics',
  CUSTOMIZE_BRANDING: 'agency:branding',

  // Admin
  VIEW_ADMIN_PANEL: 'admin:view',
  MANAGE_USERS: 'admin:users',
  MANAGE_PLATFORM: 'admin:platform',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS) as Permission[], // Admin has everything
  [ROLES.AGENCY_OWNER]: [
    PERMISSIONS.CREATE_ROOM,
    PERMISSIONS.END_ROOM,
    PERMISSIONS.DRAW,
    PERMISSIONS.USE_TOOLS,
    PERMISSIONS.MANAGE_PAGES,
    PERMISSIONS.USE_AI,
    PERMISSIONS.VIEW_ANSWER_KEY,
    PERMISSIONS.START_RECORDING,
    PERMISSIONS.VIEW_RECORDINGS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.MANAGE_SUBTUTORS,
    PERMISSIONS.VIEW_AGENCY_ANALYTICS,
    PERMISSIONS.CUSTOMIZE_BRANDING,
  ],
  [ROLES.SUB_TUTOR]: [
    PERMISSIONS.CREATE_ROOM,
    PERMISSIONS.END_ROOM,
    PERMISSIONS.DRAW,
    PERMISSIONS.USE_TOOLS,
    PERMISSIONS.MANAGE_PAGES,
    PERMISSIONS.USE_AI,
    PERMISSIONS.VIEW_ANSWER_KEY,
    PERMISSIONS.START_RECORDING,
    PERMISSIONS.VIEW_RECORDINGS,
  ],
  [ROLES.TUTOR]: [
    PERMISSIONS.CREATE_ROOM,
    PERMISSIONS.END_ROOM,
    PERMISSIONS.DRAW,
    PERMISSIONS.USE_TOOLS,
    PERMISSIONS.MANAGE_PAGES,
    PERMISSIONS.USE_AI,
    PERMISSIONS.VIEW_ANSWER_KEY,
    PERMISSIONS.START_RECORDING,
    PERMISSIONS.VIEW_RECORDINGS,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.DRAW,
    PERMISSIONS.USE_TOOLS,
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Determine the role for a user based on their DB record.
 */
export function getUserRole(params: {
  isAdmin: boolean;
  tier: string;
  parentAgencyId: string | null;
  isTutor: boolean;
}): Role {
  if (params.isAdmin) return ROLES.ADMIN;
  if (params.parentAgencyId) return ROLES.SUB_TUTOR;
  if (['AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(params.tier))
    return ROLES.AGENCY_OWNER;
  if (params.isTutor) return ROLES.TUTOR;
  return ROLES.STUDENT;
}
