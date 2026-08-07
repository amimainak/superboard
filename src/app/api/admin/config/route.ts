// ============================================================
// Admin API — Platform Configuration
// ============================================================
// GET  — Get current platform config
// PATCH — Update maintenance mode and announcement banner
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  // Anyone authenticated can read config (for banner display)
  // But admin-only for the settings tab
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    let config = await db.platformConfig.findUnique({ where: { id: 'platform' } });
    if (!config) {
      config = await db.platformConfig.create({
        data: { id: 'platform', maintenanceMode: false },
      });
    }
    return NextResponse.json({
      maintenanceMode: config.maintenanceMode,
      announcementText: config.announcementText,
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error('[Admin Config GET]', error);
    return NextResponse.json({ error: 'Failed to fetch config.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { maintenanceMode, announcementText } = body;

    const updateData: any = {};
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (announcementText !== undefined) updateData.announcementText = announcementText || null;

    const config = await db.platformConfig.upsert({
      where: { id: 'platform' },
      update: updateData,
      create: { id: 'platform', ...updateData, maintenanceMode: updateData.maintenanceMode ?? false },
    });

    // Log individual changes
    if (maintenanceMode !== undefined) {
      await logAudit(adminCheck.userId, 'PLATFORM_MAINTENANCE_TOGGLE', 'PlatformConfig', 'platform', {
        maintenanceMode,
      });
    }
    if (announcementText !== undefined) {
      await logAudit(adminCheck.userId, 'PLATFORM_ANNOUNCEMENT_CHANGE', 'PlatformConfig', 'platform', {
        announcementText: announcementText || null,
      });
    }

    return NextResponse.json({
      maintenanceMode: config.maintenanceMode,
      announcementText: config.announcementText,
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error('[Admin Config PATCH]', error);
    return NextResponse.json({ error: 'Failed to update config.' }, { status: 500 });
  }
}
