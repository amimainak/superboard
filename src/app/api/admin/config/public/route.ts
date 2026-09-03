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
    const config = await db.platformConfig.findUnique({ where: { key: 'platform' } });
    const value = (config?.value ?? {}) as Record<string, unknown>;
    return NextResponse.json({
      maintenanceMode:
        typeof value.maintenanceMode === 'boolean' ? value.maintenanceMode : false,
      announcementText:
        typeof value.announcementText === 'string' ? value.announcementText : null,
    });
  } catch {
    return NextResponse.json({
      maintenanceMode: false,
      announcementText: null,
    });
  }
}
