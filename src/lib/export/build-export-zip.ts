// ============================================================
// build-export-zip.ts — assemble the full data export ZIP
// ============================================================
// Collects every board (Room + pages) owned by the tutor, renders
// each to a multi-page PDF, and packages everything into a ZIP
// archive along with a portable JSON of all the tutor's data.
//
// ZIP structure:
//   /boards/01-Fractions-Visual-Guide.pdf
//   /boards/02-Equivalent-Fractions.pdf
//   /boards/...
//   /data/boards.json          — raw board metadata + page snapshots
//   /data/students.json        — student roster (no tokens)
//   /data/homework.json        — homework assignments (no tokens)
//   /data/lesson-notes.json    — lesson notes
//   /README.txt                — what's in this export + how to use it
//
// Security: tokens are stripped from the JSON export. The PDFs
// contain only what was on the boards. No passwords, no auth
// tokens, no PII beyond what the tutor themselves entered.
// ============================================================

import { ZipArchive } from 'archiver'
import { db } from '@/lib/db'
import { renderBoardToPdf } from './render-board-to-pdf'

interface BuildOptions {
  userId: string
  // Progress callback — called after each board is processed
  onProgress?: (done: number, total: number, currentTitle: string) => void
}

interface BuildResult {
  buffer: Buffer
  boardCount: number
  totalSize: number
}

/**
 * Build the full export ZIP for a tutor.
 * Returns the ZIP as a Buffer + metadata.
 */
export async function buildExportZip({ userId, onProgress }: BuildOptions): Promise<BuildResult> {
  // Load all boards owned by this tutor
  const boards = await db.room.findMany({
    where: { tutorId: userId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      subject: true,
      studentName: true,
      tags: true,
      isArchived: true,
      createdAt: true,
      lastOpenedAt: true,
      durationMinutes: true,
      startedAt: true,
      endedAt: true,
      pages: {
        orderBy: { pageIndex: 'asc' },
        select: { pageIndex: true, snapshot: true, createdAt: true },
      },
    },
  })

  // Load supporting data (tokens stripped)
  const [students, homework, lessonNotes, user] = await Promise.all([
    db.student.findMany({
      where: { agencyId: userId },
      select: {
        name: true, email: true, isActive: true, createdAt: true,
        parentName: true, parentEmail: true, parentPhone: true,
        gradeLevel: true, subjects: true, notes: true,
        // joinToken deliberately excluded — security
      },
    }),
    db.homeworkAssignment.findMany({
      where: { tutorId: userId },
      select: {
        title: true, description: true, status: true, late: true,
        dueAt: true, createdAt: true, submittedAt: true, openedAt: true,
        student: { select: { name: true, email: true } },
        // assignmentToken deliberately excluded — security
      },
    }),
    db.lessonNote.findMany({
      where: { tutorId: userId },
      select: { content: true, createdAt: true, updatedAt: true, room: { select: { subject: true, title: true } } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, createdAt: true },
    }),
  ])

  // Create the archive
  const archive = new ZipArchive({ zlib: { level: 6 } })
  const chunks: Buffer[] = []
  archive.on('data', (chunk: Buffer) => chunks.push(chunk))

  const archiveDone = new Promise<void>((resolve, reject) => {
    archive.on('end', resolve)
    archive.on('error', reject)
  })

  // README
  const readme = `Superboard Data Export
======================

Generated: ${new Date().toISOString()}
Tutor: ${user?.name || user?.email || 'Unknown'}
Boards: ${boards.length}
Students: ${students.length}
Homework assignments: ${homework.length}
Lesson notes: ${lessonNotes.length}

Contents
--------
/boards/        — Each board as a multi-page PDF (one PDF per board)
/data/boards.json     — Raw board metadata + page snapshots (JSON)
/data/students.json   — Student roster (join tokens excluded)
/data/homework.json   — Homework assignments (assignment tokens excluded)
/data/lesson-notes.json — Lesson notes

About this export
-----------------
This is a complete copy of your data on Superboard. We never delete
anything when you export — your boards, students, and history stay
right where they are. This is for your peace of mind and your
professional independence.

If you have questions, contact support@superboard.live.

— The Superboard team
`
  archive.append(readme, { name: 'README.txt' })

  // Render each board to PDF
  let boardCount = 0
  let counter = 0
  for (const board of boards) {
    counter++
    const safeTitle = sanitizeFilename(board.title || `Untitled-${board.id.slice(0, 8)}`)
    const num = String(counter).padStart(2, '0')
    const filename = `${num}-${safeTitle}.pdf`

    try {
      const { pdfBuffer, pageCount } = await renderBoardToPdf(
        board.pages.map((p) => ({ pageIndex: p.pageIndex, snapshot: p.snapshot }))
      )
      archive.append(pdfBuffer, { name: `boards/${filename}` })
      boardCount++

      if (onProgress) {
        onProgress(counter, boards.length, board.title || 'Untitled')
      }
      // Log page count in case it's useful for debugging
      void pageCount
    } catch (e) {
      // If a board fails to render, log and continue — we don't want
      // one bad board to break the whole export
      console.error(`[buildExportZip] Board ${board.id} (${filename}) failed:`, e instanceof Error ? e.message : e)
      archive.append(
        `This board could not be exported as a PDF.\nBoard ID: ${board.id}\nTitle: ${board.title || 'Untitled'}\nError: ${e instanceof Error ? e.message : 'Unknown error'}\n`,
        { name: `boards/${filename}.error.txt` }
      )
    }
  }

  // JSON data
  const boardsJson = JSON.stringify({
    exportedAt: new Date().toISOString(),
    tutor: { email: user?.email, name: user?.name },
    boards: boards.map((b) => ({
      id: b.id,
      title: b.title,
      subject: b.subject,
      studentName: b.studentName,
      tags: b.tags,
      isArchived: b.isArchived,
      createdAt: b.createdAt.toISOString(),
      lastOpenedAt: b.lastOpenedAt?.toISOString() ?? null,
      durationMinutes: b.durationMinutes,
      startedAt: b.startedAt?.toISOString() ?? null,
      endedAt: b.endedAt?.toISOString() ?? null,
      pages: b.pages.map((p) => ({
        pageIndex: p.pageIndex,
        snapshot: p.snapshot,
        createdAt: p.createdAt.toISOString(),
      })),
    })),
  }, null, 2)
  archive.append(boardsJson, { name: 'data/boards.json' })

  archive.append(JSON.stringify({
    exportedAt: new Date().toISOString(),
    students,
  }, null, 2), { name: 'data/students.json' })

  archive.append(JSON.stringify({
    exportedAt: new Date().toISOString(),
    homework,
  }, null, 2), { name: 'data/homework.json' })

  archive.append(JSON.stringify({
    exportedAt: new Date().toISOString(),
    lessonNotes,
  }, null, 2), { name: 'data/lesson-notes.json' })

  // Finalize
  archive.finalize()
  await archiveDone

  const buffer = Buffer.concat(chunks)
  return {
    buffer,
    boardCount,
    totalSize: buffer.length,
  }
}

function sanitizeFilename(name: string): string {
  // Strip characters that are unsafe in filenames, collapse whitespace
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .trim() || 'Untitled'
}
