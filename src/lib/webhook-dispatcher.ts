// ============================================================
// Webhook Dispatcher
// ============================================================
// Dispatches webhook events to registered endpoints.
// Signs payloads with HMAC-SHA256 for verification.
// Uses fire-and-forget pattern — errors are logged but don't block.
// ============================================================

import crypto from 'crypto';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * SECURITY FIX (FE-C02): Check if an IP address is private/reserved.
 * Prevents SSRF attacks against internal infrastructure (AWS metadata, etc.).
 */
function isPrivateIP(ip: string): boolean {
  // Parse IPv4
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;
  }
  // IPv6 loopback
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  return false;
}

/**
 * SECURITY FIX (FE-C02): Resolve URL hostname and check for private IPs.
 * Rejects webhooks pointing to internal infrastructure.
 */
async function isUrlSafe(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;
    // Resolve hostname to IP
    const lookupResult = await lookup(parsed.hostname, { verbatim: false });
    const addresses = Array.isArray(lookupResult) ? lookupResult : [lookupResult];
    for (const addr of addresses) {
      const addrStr = typeof addr === 'string' ? addr : addr.address;
      if (isPrivateIP(addrStr)) {
        console.warn(`[Webhook] SSRF blocked: ${url} resolves to private IP ${addr}`);
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
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
    // SECURITY FIX (FE-C02): Validate URL is not pointing to internal infrastructure
    const safe = await isUrlSafe(webhook.url);
    if (!safe) {
      console.error(`[Webhook] Blocked SSRF attempt: ${webhook.url}`);
      continue;
    }

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
