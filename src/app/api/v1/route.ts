// ============================================================
// Superboard — LMS Integration API Index
// GET: Returns API documentation and available endpoints
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superboard.app'

  return NextResponse.json({
    name: 'Superboard LMS Integration API',
    version: 'v1',
    description: 'Public REST API for LMS platforms (Moodle, Canvas, Google Classroom) to integrate with Superboard whiteboard sessions.',
    base_url: `${baseUrl}/api/v1`,
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      description: 'Include your API key in the x-api-key header for all authenticated requests.',
      how_to_get: 'Contact support@superboard.app or set SUPERBOARD_API_KEYS env var for development.',
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1',
        description: 'This documentation',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/v1/rooms',
        description: 'List rooms accessible to the API key owner',
        auth: true,
        query_params: [
          { name: 'status', type: 'string', description: 'Filter by status: active or ended' },
          { name: 'subject', type: 'string', description: 'Filter by subject' },
          { name: 'limit', type: 'number', description: 'Max results (default 20, max 100)' },
          { name: 'offset', type: 'number', description: 'Pagination offset' },
        ],
      },
      {
        method: 'POST',
        path: '/api/v1/rooms',
        description: 'Create a new whiteboard room',
        auth: true,
        body: {
          subject: { type: 'string', enum: ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'], default: 'GENERAL' },
          brandingLogo: { type: 'string', description: 'URL for branded logo (optional)' },
          brandingColor: { type: 'string', description: 'Hex color for branding (optional)' },
          durationMinutes: { type: 'number', description: 'Expected session duration in minutes (optional)' },
        },
      },
      {
        method: 'GET',
        path: '/api/v1/rooms/:roomId',
        description: 'Get room details',
        auth: true,
      },
      {
        method: 'PATCH',
        path: '/api/v1/rooms/:roomId',
        description: 'Update room (subject, status, etc.)',
        auth: true,
        body: {
          subject: { type: 'string', description: 'Update subject (optional)' },
          isActive: { type: 'boolean', description: 'Set room active/inactive (optional)' },
          durationMinutes: { type: 'number', description: 'Update duration (optional)' },
        },
      },
    ],
    response_format: {
      success: { status: 200, type: 'application/json' },
      created: { status: 201, type: 'application/json' },
      error: { status: '4xx/5xx', body: { error: 'string' } },
    },
    rate_limits: {
      description: 'API is rate-limited per API key',
      limits: {
        read: '60 requests per minute',
        write: '20 requests per minute',
      },
    },
    lms_integration_notes: {
      moodle: 'Use the API key in Moodle External Tool configuration. Set the tool URL to the base_url.',
      canvas: 'Configure as an LTI 1.3 tool in Canvas. The API key maps to the developer key.',
      google_classroom: 'Use as a Classroom add-on. The API key is set in the add-on configuration.',
    },
  })
}