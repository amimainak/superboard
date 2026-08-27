import { z, ZodSchema } from 'zod';

export function validateBody<T>(body: unknown, schema: ZodSchema<T>): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Zod v4 uses issues array
      const issues = 'issues' in err ? (err.issues as Array<{ path: (string | number)[]; message: string }>) : [];
      if (issues.length > 0) {
        return { success: false, error: issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
      }
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Invalid request body' };
  }
}
