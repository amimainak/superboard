import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Append pgbouncer=true to avoid prepared statement conflicts
// with Supabase's PgBouncer pooler (port 6543).
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''
  if (baseUrl.includes('pgbouncer=')) return baseUrl
  return baseUrl + '?pgbouncer=true'
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
