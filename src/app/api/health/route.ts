import { NextResponse } from 'next/server';

import { ensureSchema, isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  if (isDatabaseConfigured()) {
    await ensureSchema();
  }

  return NextResponse.json({
    status: 'ok',
    databaseConfigured: isDatabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
