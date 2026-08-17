# Task b4c: LMS Integration API Skeleton

## Files Created
- `src/lib/api-key.ts` — API key validation utility
- `src/app/api/v1/route.ts` — API index/documentation endpoint
- `src/app/api/v1/rooms/route.ts` — Room list (GET) and create (POST)
- `src/app/api/v1/rooms/[roomId]/route.ts` — Room detail (GET) and update (PATCH)

## Implementation Details
- **api-key.ts**: Validates `x-api-key` header. Checks `SUPERBOARD_API_KEYS` env var (comma-separated). Falls back to `dev-api-key` for development. Exports `validateApiKey()` and `requireApiKey()` (returns response directly for middleware pattern).
- **GET /api/v1**: Returns comprehensive JSON documentation including endpoints, auth info, rate limits, and LMS-specific integration notes for Moodle, Canvas, and Google Classroom.
- **GET /api/v1/rooms**: Lists rooms with filtering (status, subject) and pagination (limit, offset). Rate limited at 60 req/min.
- **POST /api/v1/rooms**: Creates room with subject validation, creates initial BoardPage. Rate limited at 20 req/min.
- **GET /api/v1/rooms/[roomId]**: Returns room details with page count and whiteboard URL.
- **PATCH /api/v1/rooms/[roomId]**: Updates subject, isActive, durationMinutes, brandingColor, brandingLogo with full validation. Auto-sets endedAt when isActive=false.
