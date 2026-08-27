import { z } from 'zod'

// ---- Enums ----
export const SUBJECTS = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'] as const
export type Subject = (typeof SUBJECTS)[number]

export const TIERS = ['FREE', 'PRO', 'AGENCY'] as const
export type Tier = (typeof TIERS)[number]

// ---- Room ----
export const createRoomSchema = z.object({
  subject: z.enum(SUBJECTS).default('GENERAL'),
  brandingLogo: z.string().max(500).url().optional(),
  brandingColor: z.string().max(7).regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const updateRoomSchema = z.object({
  subject: z.enum(SUBJECTS).optional(),
  isActive: z.boolean().optional(),
  endedAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(0).max(480).optional(),
})

// ---- Board Page ----
export const pageSnapshotSchema = z.object({
  elements: z.array(z.record(z.string(), z.unknown())).max(500),
  camera: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().min(0.1).max(10),
  }),
})

export const savePagesSchema = z.object({
  pages: z.array(z.object({
    pageIndex: z.number().int().min(0),
    snapshot: pageSnapshotSchema,
  })).max(20),
})

export const upsertPageSchema = z.object({
  snapshot: pageSnapshotSchema,
})

// ---- Template ----
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(50),
  subject: z.enum(SUBJECTS).default('GENERAL'),
  snapshot: pageSnapshotSchema.extend({
    pages: z.array(z.object({
      pageIndex: z.number().int().min(0),
      elements: z.array(z.record(z.string(), z.unknown())),
    })),
  }),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  subject: z.enum(SUBJECTS).optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
})

// ---- User Profile ----
// A-03: Only user-writable fields. NEVER include tier, email, id, isAdmin — those are server-managed.
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().max(500).url().optional(),
  bio: z.string().max(280).optional(),
  timezone: z.string().max(50).optional(),
  brandingColor: z.string().max(7).regex(/^#[0-9a-fA-F]{6}$/).optional(),
  brandingLogoUrl: z.string().max(500).url().optional(),
})

// ---- Usage Tracking ----
export const usageHeartbeatSchema = z.object({
  roomId: z.string().uuid(),
  type: z.enum(['video', 'ai']),
  minutesUsed: z.number().min(0).max(5).optional(),
})

// ---- LiveKit Token ----
export const livekitTokenSchema = z.object({
  roomName: z.string().min(1).max(200),
  participantName: z.string().min(1).max(200),
  participantIdentity: z.string().max(200).optional(),
  metadata: z.string().max(2000).optional(),
})

// ---- Helper: parse and validate request body ----
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues.map(i => i.path.join('.') + ': ' + i.message)
    return { data: null, error: errors.join('; ') }
  }
  return { data: result.data, error: null }
}

// Backward-compatible aliases for routes that import these names
export const validateInput = parseBody
export const registerSchema = z.object({ id: z.string().uuid(), email: z.string().email(), name: z.string().optional().nullable() })
export const joinRoomSchema = z.object({ roomId: z.string().min(1), studentIdentity: z.string().min(1).optional(), studentName: z.string().optional().nullable() })
export const updateScheduleSchema = z.object({ status: z.string().optional(), startTime: z.string().optional(), endTime: z.string().optional() })
export const createInviteSchema = z.object({ email: z.string().email(), role: z.string().optional() })
export const registerWebhookSchema = z.object({ url: z.string().url(), events: z.array(z.string()) })
export const applyReferralSchema = z.object({ code: z.string().min(1) })
export const aiActionSchema = z.object({ prompt: z.string().min(1), roomId: z.string().optional() })
