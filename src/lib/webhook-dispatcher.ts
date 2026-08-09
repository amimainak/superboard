// ============================================================
// Webhook Dispatcher
// ============================================================
// Dispatches webhook events to registered endpoints.
// Signs payloads with HMAC-SHA256 for verification.
// Uses fire-and-forget pattern — errors are logged but don't block.
// ============================================================

import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Dispatch webhook events to registered endpoints.
 *
 * Finds all active webhooks for the given user that are listening
 * to the specified event, then POSTs the payload to each URL
 * with an HMAC-SHA256 signature for verification.
 *
 * Uses fire-and-forget — errors are logged but don't block the caller.
 */
export async function dispatchWebhook(params: {
  userId: string;
  event: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const { db } = await import('./db');

  // Find active webhooks for this user that listen to this event
  const webhooks = await db.webhookConfig.findMany({
    where: {
      userId: params.userId,
      isActive: true,
      events: { has: params.event },
    },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event: params.event,
    timestamp: new Date().toISOString(),
    data: params.data,
  };

  const payloadStr = JSON.stringify(payload);

  // Fire webhooks in parallel (don't await — fire and forget)
  for (const webhook of webhooks) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadStr)
      .digest('hex');

    // Fire and forget — log errors but don't block
    fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': params.event,
      },
      body: payloadStr,
    }).catch((err) => {
      console.error(
        `[Webhook] Failed to deliver to ${webhook.url}:`,
        err instanceof Error ? err.message : String(err)
      );
    });
  }
}
