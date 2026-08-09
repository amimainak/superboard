-- Agency Features Migration
-- Add new fields to Student table
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "grade" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentName" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentAccessToken" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add agencyName to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyName" TEXT;

-- Add isGroup, maxStudents to ScheduledLesson
ALTER TABLE "ScheduledLesson" ADD COLUMN IF NOT EXISTS "maxStudents" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ScheduledLesson" ADD COLUMN IF NOT EXISTS "isGroup" BOOLEAN NOT NULL DEFAULT false;

-- Create new enums
DO $$ BEGIN
  CREATE TYPE "HomeworkStatus" AS ENUM ('PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Homework table
CREATE TABLE IF NOT EXISTS "Homework" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "studentId" TEXT,
  "tutorId" TEXT NOT NULL,
  "roomId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subject" "Subject" NOT NULL DEFAULT 'GENERAL',
  "dueDate" TIMESTAMP(3),
  "status" "HomeworkStatus" NOT NULL DEFAULT 'PENDING',
  "snapshot" TEXT,
  "tutorFeedback" TEXT,
  "grade" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- Create LessonNote table
CREATE TABLE IF NOT EXISTS "LessonNote" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "studentId" TEXT,
  "content" TEXT NOT NULL,
  "tutorFeedback" TEXT,
  "topicsForNext" TEXT,
  "rating" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonNote_pkey" PRIMARY KEY ("id")
);

-- Create ResourceLibrary table
CREATE TABLE IF NOT EXISTS "ResourceLibrary" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "uploadedByTutorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "subject" "Subject" NOT NULL DEFAULT 'GENERAL',
  "fileUrl" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResourceLibrary_pkey" PRIMARY KEY ("id")
);

-- Create Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "studentId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "description" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "lessonHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratePerHourCents" INTEGER NOT NULL DEFAULT 0,
  "billingPeriodStart" TIMESTAMP(3),
  "billingPeriodEnd" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentAccessToken_key" UNIQUE ("parentAccessToken");
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_roomId_key" UNIQUE ("roomId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceNumber_key" UNIQUE ("invoiceNumber");

-- Add foreign keys
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceLibrary" ADD CONSTRAINT "ResourceLibrary_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Student_parentAccessToken_idx" ON "Student"("parentAccessToken");

CREATE INDEX IF NOT EXISTS "Homework_agencyId_status_idx" ON "Homework"("agencyId", "status");
CREATE INDEX IF NOT EXISTS "Homework_studentId_status_idx" ON "Homework"("studentId", "status");
CREATE INDEX IF NOT EXISTS "Homework_tutorId_status_idx" ON "Homework"("tutorId", "status");
CREATE INDEX IF NOT EXISTS "Homework_dueDate_idx" ON "Homework"("dueDate");

CREATE INDEX IF NOT EXISTS "LessonNote_tutorId_createdAt_idx" ON "LessonNote"("tutorId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonNote_studentId_createdAt_idx" ON "LessonNote"("studentId", "createdAt");

CREATE INDEX IF NOT EXISTS "ResourceLibrary_agencyId_category_idx" ON "ResourceLibrary"("agencyId", "category");
CREATE INDEX IF NOT EXISTS "ResourceLibrary_agencyId_subject_idx" ON "ResourceLibrary"("agencyId", "subject");
CREATE INDEX IF NOT EXISTS "ResourceLibrary_uploadedByTutorId_idx" ON "ResourceLibrary"("uploadedByTutorId");

CREATE INDEX IF NOT EXISTS "Invoice_agencyId_status_idx" ON "Invoice"("agencyId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_studentId_status_idx" ON "Invoice"("studentId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- Update updatedAt trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_Homework_updatedAt ON "Homework";
CREATE TRIGGER update_Homework_updatedAt AFTER UPDATE ON "Homework" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_LessonNote_updatedAt ON "LessonNote";
CREATE TRIGGER update_LessonNote_updatedAt AFTER UPDATE ON "LessonNote" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ResourceLibrary_updatedAt ON "ResourceLibrary";
CREATE TRIGGER update_ResourceLibrary_updatedAt AFTER UPDATE ON "ResourceLibrary" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_Invoice_updatedAt ON "Invoice";
CREATE TRIGGER update_Invoice_updatedAt AFTER UPDATE ON "Invoice" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
