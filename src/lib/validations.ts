// ============================================================
// Zod Validation Schemas for API Routes
// ============================================================
// Centralized input validation using Zod v4.
// Import these schemas in API routes to validate request bodies
// and query parameters before processing.
//
// SECURITY FIXES:
// - V-14: Reduced base64 image limit from 20MB to 5MB
// - V-18: Added room name/subject sanitization patterns
// - V-22: Added stricter input length constraints
// - V-35: Added proper TypeScript types (removed as-any casts)
// ============================================================

import { z } from 'zod';
import type { AIAction } from '@/types';

// ---- Common Patterns ----

const emailSchema = z.string().email('Invalid email format').max(254, 'Email too long');
const uuidSchema = z.string().uuid('Invalid UUID format').max(100);
const nameSchema = z
  .string()
  .max(200, 'Name too long (max 200 characters)')
  .regex(/^[a-zA-Z0-9\s\-_.@']+$/, 'Name contains invalid characters')
  .optional();
const subjectSchema = z.enum(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL']);

// SECURITY (V-18): Room ID pattern — only alphanumeric and hyphens
const roomIdSchema = z
  .string()
  .min(1, 'Room ID is required')
  .max(100, 'Room ID too long')
  .regex(/^[a-zA-Z0-9-]+$/, 'Room ID contains invalid characters');

// SECURITY (V-18): Student identity pattern — UUID format preferred
const studentIdentitySchema = z
  .string()
  .min(1, 'Student identity is required')
  .max(200, 'Student identity too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Student identity contains invalid characters');

// ---- Room API ----

export const createRoomSchema = z.object({
  tutorId: uuidSchema,
  subject: subjectSchema,
  brandingLogo: z.string().url('Invalid logo URL').max(500).optional().nullable(),
  brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').max(7).optional().nullable(),
  brandingAgencyName: z
    .string()
    .max(200, 'Agency name too long')
    .regex(/^[a-zA-Z0-9\s\-_.&']+$/, 'Agency name contains invalid characters')
    .optional()
    .nullable(),
});

export const getRoomSchema = z.object({
  roomId: z.string().max(100).optional(),
  tutorId: z.string().max(100).optional(),
});

// ---- Room Participants API ----

export const joinRoomSchema = z.object({
  roomId: roomIdSchema,
  studentIdentity: studentIdentitySchema,
  studentName: z
    .string()
    .max(200, 'Student name too long')
    .regex(/^[a-zA-Z0-9\s\-_.']+$/, 'Student name contains invalid characters')
    .optional()
    .nullable(),
});

export const listParticipantsSchema = z.object({
  roomId: roomIdSchema,
});

// ---- Room Templates API ----

export const createTemplateSchema = z.object({
  tutorId: z.string().max(100).optional(),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(200, 'Template name too long')
    .regex(/^[a-zA-Z0-9\s\-_.']+$/, 'Template name contains invalid characters'),
  subject: subjectSchema,
  snapshot: z.union([z.string().max(5_000_000, 'Snapshot too large (max 5MB)'), z.record(z.string(), z.unknown())]),
});

// ---- Auth API ----

export const registerSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: nameSchema,
});

// ---- LiveKit Token API ----

export const livekitTokenSchema = z.object({
  roomId: roomIdSchema,
  userId: uuidSchema,
  userName: z
    .string()
    .min(1, 'User name is required')
    .max(100, 'User name too long')
    .regex(/^[a-zA-Z0-9\s\-_.']+$/, 'User name contains invalid characters'),
  isTutor: z.boolean().optional(),
});

// ---- Agency Invite API ----

export const createInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['sub_tutor']).optional().default('sub_tutor'),
});

export const getInviteByCodeSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{8}$/, 'Invalid invite code format'),
});

// ---- AI Action API ----

export const aiActionSchema = z.object({
  userId: uuidSchema,
  action: z.enum(["QUIZ", "WORKSHEET", "SUMMARY", "GRAMMAR", "OUTLINE", "PLOT_GRAPH", "PERFECT_SHAPE", "HANDWRITING_TO_MATH", "DIAGRAM_GENERATOR", "CHEMICAL_BALANCER", "LAB_SUMMARY", "VOCAB_QUIZ", "PHONICS_HELPER", "TIMELINE_GENERATOR", "CONCEPT_SUMMARIZER"] as [AIAction, ...AIAction[]]),
  prompt: z.string().min(1, 'Prompt is required').max(50_000, 'Prompt too long (max 50,000 characters)'),
  // SECURITY FIX (V-14): Reduced base64 image limit from 20MB to 5MB
  imageBase64: z.string().max(5_000_000, 'Image too large (max ~5MB)').optional(),
  systemPrompt: z.string().max(10_000, 'System prompt too long').optional(),
});

// ---- Auth Profile API ----

export const getProfileSchema = z.object({
  userId: z.string().max(100).optional(),
});

// ---- Helper: Validate and return parsed data or error response ----

import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

/**
 * Validates data against a Zod schema.
 * Returns { success: true, data } on success,
 * or { success: false, response: NextResponse } on failure.
 */
// SECURITY FIX (I-05): Properly typed — no more 'any' on schema parameter
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message || 'Validation error',
    }));
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}
