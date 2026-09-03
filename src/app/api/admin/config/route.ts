// ============================================================
// Admin API — Platform Configuration
// ============================================================
// GET  — Get current platform config
// PATCH — Update maintenance mode and announcement banner
// ============================================================
// PlatformConfig is a key/value store where `value` (Json) holds the
// actual config payload: { maintenanceMode: boolean, announcementText: string | null }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const CONFIG_KEY = 'platform';

type PlatformConfigValue = {
  maintenanceMode?: boolean;
  announcementText?: string | null;
};

/** Read the platform config JSON value (or sensible defaults if missing). */
function readConfigValue(raw: unknown): PlatformConfigValue {
  const v = (raw ?? {}) as Record<string, unknown>;
  return {
    maintenanceMode: typeof v.maintenanceMode === 'boolean' ? v.maintenanceMode : false,
    announcementText:
      typeof v.announcementText === 'string' ? v.announcementText : null,
  };
}

export async function GET(request: NextRequest) {
  // Anyone authenticated can read config (for banner display)
  // But admin-only for the settings tab
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    let config = await db.platformConfig.findUnique({ where: { key: CONFIG_KEY } });
    if (!config) {
      config = await db.platformConfig.create({
        data: { key: CONFIG_KEY, value: { maintenanceMode: false, announcementText: null } },
      });
    }
    const value = readConfigValue(config.value);
    return NextResponse.json({
      maintenanceMode: value.maintenanceMode,
      announcementText: value.announcementText,
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
    const { maintenanceMode, announcementText } = body as PlatformConfigValue;

    // SECURITY: Validate maintenanceMode is boolean
    if (maintenanceMode !== undefined && typeof maintenanceMode !== 'boolean') {
      return NextResponse.json({ error: 'maintenanceMode must be a boolean' }, { status: 400 });
    }

    // SECURITY FIX (API-M04): Validate announcementText length
    if (typeof announcementText === 'string' && announcementText.length > 5000) {
      return NextResponse.json({ error: 'Announcement text too long (max 5000 chars)' }, { status: 400 });
    }

    // Read existing value (or defaults) so partial updates merge cleanly.
    const existing = await db.platformConfig.findUnique({ where: { key: CONFIG_KEY } });
    const existingValue = readConfigValue(existing?.value);
    const nextValue: PlatformConfigValue = {
      maintenanceMode:
        maintenanceMode !== undefined ? maintenanceMode : existingValue.maintenanceMode,
      announcementText:
        announcementText !== undefined
          ? announcementText || null
          : existingValue.announcementText,
    };

    const config = await db.platformConfig.upsert({
      where: { key: CONFIG_KEY },
      update: { value: nextValue as any },
      create: { key: CONFIG_KEY, value: nextValue as any },
    });

    // Log individual changes
    if (maintenanceMode !== undefined) {
      await logAudit(adminCheck.userId, 'PLATFORM_MAINTENANCE_TOGGLE', 'PlatformConfig', CONFIG_KEY, {
        maintenanceMode,
      });
    }
    if (announcementText !== undefined) {
      await logAudit(adminCheck.userId, 'PLATFORM_ANNOUNCEMENT_CHANGE', 'PlatformConfig', CONFIG_KEY, {
        announcementText: announcementText || null,
      });
    }

    const value = readConfigValue(config.value);
    return NextResponse.json({
      maintenanceMode: value.maintenanceMode,
      announcementText: value.announcementText,
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error('[Admin Config PATCH]', error);
    return NextResponse.json({ error: 'Failed to update config.' }, { status: 500 });
  }
}
