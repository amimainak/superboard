import type { ToolId } from './whiteboard/types'

export type UserRole = 'tutor' | 'student'

/**
 * Defines what students can and cannot do in a room.
 * Tutors have unrestricted access to everything.
 */
interface PermissionSet {
  /** Tools the role can use */
  allowedTools: ToolId[]
  /** Can the role add/delete pages */
  canManagePages: boolean
  /** Can the role clear the entire board */
  canClearBoard: boolean
  /** Can the role upload files */
  canUploadFiles: boolean
  /** Can the role access AI features */
  canUseAI: boolean
  /** Can the role change room settings */
  canManageRoom: boolean
  /** Can the role pin/delete chat messages */
  canModerateChat: boolean
  /** Can the role share links in chat (K-12 safety) */
  canShareLinks: boolean
  /** Can the role export the board */
  canExport: boolean
  /** Can the role use presentation mode */
  canPresent: boolean
}

// All available tools
const ALL_TOOLS: ToolId[] = [
  'select', 'hand', 'draw', 'highlighter', 'eraser', 'eraser-object',
  'arrow', 'text', 'sticky', 'image', 'frame', 'laser',
  'line', 'rectangle', 'ellipse', 'diamond', 'triangle',
]

// Student-safe tools (no frame, no image upload for safety)
const STUDENT_TOOLS: ToolId[] = [
  'select', 'hand', 'draw', 'highlighter', 'eraser', 'eraser-object',
  'arrow', 'text', 'sticky', 'laser',
  'line', 'rectangle', 'ellipse', 'diamond', 'triangle',
]

export const TUTOR_PERMISSIONS: PermissionSet = {
  allowedTools: ALL_TOOLS,
  canManagePages: true,
  canClearBoard: true,
  canUploadFiles: true,
  canUseAI: true,
  canManageRoom: true,
  canModerateChat: true,
  canShareLinks: true,
  canExport: true,
  canPresent: true,
}

export const STUDENT_PERMISSIONS: PermissionSet = {
  allowedTools: STUDENT_TOOLS,
  canManagePages: false,
  canClearBoard: false,
  canUploadFiles: false,
  canUseAI: false,
  canManageRoom: false,
  canModerateChat: false,
  canShareLinks: false, // K-12 safety: no links in chat
  canExport: false,
  canPresent: false,
}

export function getPermissions(role: UserRole): PermissionSet {
  return role === 'tutor' ? TUTOR_PERMISSIONS : STUDENT_PERMISSIONS
}

export function canUseTool(role: UserRole, toolId: ToolId): boolean {
  return getPermissions(role).allowedTools.includes(toolId)
}
