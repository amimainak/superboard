// ============================================================
// Admin API — Public Config (for banner display, no admin check)
// ============================================================
// GET — Returns maintenance mode + announcement text
// Used by the frontend to show maintenance/announcement banners
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const config = await db.platformConfig.findUnique({ where: { id: 'platform' } });
    return NextResponse.json({
      maintenanceMode: config?.maintenanceMode ?? false,
      announcementText: config?.announcementText ?? null,
    });
  } catch {
    return NextResponse.json({
      maintenanceMode: false,
      announcementText: null,
    });
  }
}
