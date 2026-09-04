-- HomeworkAssignment table (F-04 v1.3)
CREATE TABLE IF NOT EXISTS "HomeworkAssignment" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" UUID,
    "sourceRoomId" TEXT,
    "assignmentToken" TEXT NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "studentSnapshot" JSONB NOT NULL,
    "feedbackSnapshot" JSONB,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "submittedAt" TIMESTAMP(3),
    "late" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "submitUntil" TIMESTAMP(3) NOT NULL,
    "viewUntil" TIMESTAMP(3) NOT NULL,
    "parentNotifyOnReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAssignment_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "HomeworkAssignment_tutorId_idx" ON "HomeworkAssignment"("tutorId");
CREATE INDEX IF NOT EXISTS "HomeworkAssignment_studentId_idx" ON "HomeworkAssignment"("studentId");
CREATE INDEX IF NOT EXISTS "HomeworkAssignment_status_idx" ON "HomeworkAssignment"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "HomeworkAssignment_assignmentToken_key" ON "HomeworkAssignment"("assignmentToken");

-- Add foreign key constraints (User.id is TEXT, Student.id is UUID)
ALTER TABLE "HomeworkAssignment"
  ADD CONSTRAINT "HomeworkAssignment_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "HomeworkAssignment"
  ADD CONSTRAINT "HomeworkAssignment_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL;
