import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Properly append pgbouncer=true to the DATABASE_URL.
// Handles URLs that may already have query parameters.
// NOTE: We use string manipulation instead of new URL() because
// new URL() mangles postgres:// protocol to postgres:/ format.
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) return baseUrl;
  if (baseUrl.includes('pgbouncer=')) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return baseUrl + separator + 'pgbouncer=true';
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
