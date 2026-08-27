// ============================================================
// API Route: LiveKit Webhook
// ============================================================
// Receives webhook events from LiveKit (egress started, ended, failed).
// Updates recording status and URL in the database.
// SECURITY: Validates LiveKit webhook authorization header.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const LIVEKIT_WEBHOOK_SECRET = process.env.LIVEKIT_WEBHOOK_SECRET || '';

// Webhook event types we handle
type WebhookEvent = {
  event: string;
  egressId: string;
  roomId?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  error?: string;
  fileLocation?: string;
  status?: string;
};

/**
 * SECURITY FIX (RT-C05): Timing-safe string comparison.
 * Prevents timing side-channel attacks on webhook auth.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX (RT-C05): Always require webhook auth.
    // No longer skips when secret is unconfigured — fail closed, not open.
    const bodyText = await request.text();
    const authHeader = request.headers.get('authorization') || request.headers.get('livekit-webhook-auth');

    if (!LIVEKIT_WEBHOOK_SECRET || LIVEKIT_WEBHOOK_SECRET.startsWith('TODO_')) {
      console.error('[LiveKit Webhook] LIVEKIT_WEBHOOK_SECRET not configured — rejecting all webhook events');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    // Use timing-safe comparison to prevent timing attacks
    const expectedAuth = `Bearer ${LIVEKIT_WEBHOOK_SECRET}`;
    if (!authHeader || !timingSafeEqual(authHeader, expectedAuth)) {
      console.warn('[LiveKit Webhook] Invalid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event: WebhookEvent = JSON.parse(bodyText);

    console.log(`[LiveKit Webhook] Event: ${event.event}, EgressID: ${event.egressId}`);

    // Handle egress ended — update recording with final URL
    if (event.event === 'egress_ended' && event.egressId) {
      const recording = await db.recording.findFirst({
        where: { egressId: event.egressId },
      });

      if (recording) {
        const duration = event.duration
          ? event.duration
          : recording.startedAt
            ? Math.round((Date.now() - recording.startedAt.getTime()) / 1000)
            : 0;

        await db.recording.update({
          where: { id: recording.id },
          data: {
            status: 'STOPPED',
            url: event.fileLocation || recording.url,
            duration,
            endedAt: event.endTime ? new Date(event.endTime) : new Date(),
          },
        });

        console.log(`[LiveKit Webhook] Updated recording ${recording.id}: duration=${duration}s, url=${event.fileLocation || 'pending'}`);
      }
    }

    // Handle egress failed
    if (event.event === 'egress_failed' && event.egressId) {
      const recording = await db.recording.findFirst({
        where: { egressId: event.egressId },
      });

      if (recording) {
        await db.recording.update({
          where: { id: recording.id },
          data: {
            status: 'FAILED',
            endedAt: new Date(),
          },
        });

        console.error(`[LiveKit Webhook] Recording failed: ${recording.id}, error: ${event.error}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[LiveKit Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
