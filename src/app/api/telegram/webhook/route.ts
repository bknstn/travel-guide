import { NextRequest, NextResponse } from 'next/server';

import { getBot } from '@/lib/bot';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret) {
    const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid Telegram secret' }, { status: 401 });
    }
  }

  const update = await request.json();
  const bot = getBot();
  await bot.handleUpdate(update);

  return NextResponse.json({ status: 'ok' });
}
