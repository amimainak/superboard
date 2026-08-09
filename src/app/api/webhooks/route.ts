// ============================================================
// API Route: Webhook Management
// ============================================================
// GET:  List configured webhooks for the authenticated user
// POST: Register a new webhook endpoint
//       Body: { url: string, events: string[], secret?: string }
//       - URL must be HTTPS
//       - Events must be from the allowed set
//       - Generates a random secret if not provided
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { validateInput, registerWebhookSchema } from '@/lib/validations';
import crypto from 'crypto';

// Allowed webhook event types
const ALLOWED_EVENTS = [
  'room.created',
  'room.ended',
  'recording.completed',
  'student.joined',
  'lesson.scheduled',
] as const;

export type WebhookEvent = (typeof ALLOWED_EVENTS)[number];

/**
 * GET /api/webhooks
 * List all webhooks configured for the authenticated user.
 * Strips the secret from the response for security.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const webhooks = await db.webhookConfig.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        // NOTE: secret is intentionally excluded for security
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('[Webhooks List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Register a new webhook endpoint.
 * Validates URL (HTTPS only), events, and generates a secret if not provided.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput(registerWebhookSchema, body);
    if (!parsed.success) return parsed.response;

    const { url, events, secret } = parsed.data;

    // Validate that all events are from the allowed set
    const invalidEvents = events.filter(
      (e) => !ALLOWED_EVENTS.includes(e as WebhookEvent)
    );
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid event types',
          details: {
            invalidEvents,
            allowedEvents: ALLOWED_EVENTS,
          },
        },
        { status: 400 }
      );
    }

    // Check webhook count limit (max 10 per user)
    const existingCount = await db.webhookConfig.count({
      where: { userId: auth.userId },
    });
    if (existingCount >= 10) {
      return NextResponse.json(
        { error: 'Webhook limit reached — maximum 10 webhooks per user' },
        { status: 400 }
      );
    }

    // Generate a secret if not provided
    const webhookSecret =
      secret || crypto.randomBytes(32).toString('hex');

    // Create the webhook
    const webhook = await db.webhookConfig.create({
      data: {
        userId: auth.userId,
        url,
        events,
        secret: webhookSecret,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret, // Return secret only on creation
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Webhook Register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register webhook' },
      { status: 500 }
    );
  }
}
