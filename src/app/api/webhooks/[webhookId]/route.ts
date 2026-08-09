// ============================================================
// API Route: Webhook Management (Single Webhook)
// ============================================================
// GET:    Get a single webhook by ID
// DELETE: Remove a webhook endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ webhookId: string }>;
}

/**
 * GET /api/webhooks/[webhookId]
 * Fetch a single webhook by ID. Only the owner can view it.
 * Returns the webhook details (secret stripped).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { webhookId } = await params;

    const webhook = await db.webhookConfig.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Ownership check — only the webhook owner can view it
    // We need to do a full query to verify ownership
    const ownedWebhook = await db.webhookConfig.findFirst({
      where: { id: webhookId, userId: auth.userId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!ownedWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook: ownedWebhook });
  } catch (error) {
    console.error('[Webhook Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[webhookId]
 * Remove a webhook endpoint. Only the owner can delete it.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { webhookId } = await params;

    // Verify the webhook belongs to the authenticated user
    const existing = await db.webhookConfig.findFirst({
      where: { id: webhookId, userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Delete the webhook
    await db.webhookConfig.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('[Webhook Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
