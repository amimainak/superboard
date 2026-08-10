// ============================================================
// API Route: Bulk Import Students (CSV)
// ============================================================
// POST: Import students from CSV format (email,name per line).
//       Agency owner or sub-tutor auth required.
//       Returns success + failure rows.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can import students' },
        { status: 403 }
      );
    }

    const agencyId = agency.parentAgencyId || auth.userId;

    const body = await request.json();
    const { csv } = body;

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json(
        { error: 'CSV data is required (email,name per line)' },
        { status: 400 }
      );
    }

    // Parse CSV: each line is "email,name"
    const lines = csv.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    // SECURITY FIX (API-M08): Limit import size to prevent abuse
    if (lines.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 });
    }

    const results = { imported: 0, reactivated: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p: string) => p.trim());
      if (parts.length < 2) {
        results.failed++;
        results.errors.push(`Line ${i + 1}: Invalid format (expected email,name)`);
        continue;
      }

      const email = parts[0].toLowerCase();
      const name = parts.slice(1).join(',').trim(); // In case name contains commas

      if (!email || !name) {
        results.failed++;
        results.errors.push(`Line ${i + 1}: Email and name are required`);
        continue;
      }

      try {
        // Check existing
        const existing = await db.student.findUnique({
          where: { agencyId_email: { agencyId, email } },
        });

        if (existing) {
          if (existing.isActive) {
            results.failed++;
            results.errors.push(`Line ${i + 1}: ${email} already exists`);
            continue;
          }

          // Reactivate
          await db.student.update({
            where: { id: existing.id },
            data: { name, isActive: true, deactivatedAt: null },
          });
          results.reactivated++;
        } else {
          await db.student.create({
            data: { agencyId, email, name, isActive: true },
          });
          results.imported++;
        }
      } catch {
        results.failed++;
        results.errors.push(`Line ${i + 1}: Database error for ${email}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: lines.length,
      imported: results.imported,
      reactivated: results.reactivated,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('[Student Import] Error:', error);
    return NextResponse.json(
      { error: 'Failed to import students' },
      { status: 500 }
    );
  }
}
