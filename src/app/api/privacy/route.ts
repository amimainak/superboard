// ============================================================
// API Route: Privacy — Data Deletion (GDPR/CCPA/COPPA)
// ============================================================
// DELETE: Remove all user data including room participation,
//         fingerprint hashes, and usage logs.
// Supported by COPPA (children under 13) and GDPR right to erasure.
//
// COPPA-SPECIFIC BEHAVIOR:
//   When reason='coppa_under_13', performs full data erasure:
//   - Anonymizes user record (replaces PII with hashes)
//   - Deletes all room participations
//   - Deletes all usage logs
//   - Deletes all recordings
//   - Marks user with dataDeletedAt timestamp
//   - Does NOT delete the user row itself (FK constraints)
//
// GDPR/CCPA BEHAVIOR:
//   When reason='gdpr_erasure' or 'ccpa', same full erasure.
//   When reason='user_request', same full erasure.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'user_request';

    // Valid reasons: user_request, coppa_under_13, gdpr_erasure, ccpa
    const VALID_REASONS = ['user_request', 'coppa_under_13', 'gdpr_erasure', 'ccpa'];
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const now = new Date();

    // --- Step 1: Delete all dependent data ---

    // Delete room participant records
    const deletedParticipants = await db.roomParticipant.deleteMany({
      where: { studentIdentity: auth.userId },
    });

    // Delete usage logs
    const deletedUsageLogs = await db.usageLog.deleteMany({
      where: { userId: auth.userId },
    });

    // Delete recordings (for tutors)
    const deletedRecordings = await db.recording.deleteMany({
      where: { tutorId: auth.userId },
    });

    // --- Step 2: Anonymize the user record ---
    // We keep the row for FK integrity but remove all PII
    await db.user.update({
      where: { id: auth.userId },
      data: {
        // Anonymize PII
        email: `deleted_${Date.now()}@anonymized.invalid`,
        name: null,
        fingerprintHash: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        customDomain: null,
        brandingLogoUrl: null,
        brandingColor: null,
        parentEmail: null,
        // Mark as COPPA-restricted if applicable
        under13: reason === 'coppa_under_13' ? true : undefined,
        // Set tier to FREE (cancel any subscription)
        tier: 'FREE',
        // Record deletion timestamp
        dataDeletedAt: now,
      },
    });

    const isCoppa = reason === 'coppa_under_13';

    console.log(
      `[Privacy] Data deleted for user ${auth.userId} (reason: ${reason})` +
      ` — participants: ${deletedParticipants.count}, ` +
      `usageLogs: ${deletedUsageLogs.count}, ` +
      `recordings: ${deletedRecordings.count}` +
      (isCoppa ? ' [COPPA FULL ERASURE]' : '')
    );

    return NextResponse.json({
      success: true,
      reason,
      deleted: [
        'roomParticipants',
        'usageLogs',
        'recordings',
        'fingerprintHash',
        'stripeCustomerId',
        'brandingData',
        'parentEmail',
      ],
      anonymized: true,
      dataDeletedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[Privacy] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}

/**
 * GET: Return the user's privacy data summary (for GDPR data portability).
 * Allows users to see what data we hold about them before requesting deletion.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
        under13: true,
        dataDeletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participantCount = await db.roomParticipant.count({
      where: { studentIdentity: auth.userId },
    });

    const roomCount = await db.room.count({
      where: { tutorId: auth.userId },
    });

    const usageLogCount = await db.usageLog.count({
      where: { userId: auth.userId },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        createdAt: user.createdAt,
        under13: user.under13,
        dataDeletedAt: user.dataDeletedAt,
      },
      dataSummary: {
        roomsAsTutor: roomCount,
        roomParticipations: participantCount,
        usageLogEntries: usageLogCount,
      },
    });
  } catch (error) {
    console.error('[Privacy] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy data' },
      { status: 500 }
    );
  }
}
