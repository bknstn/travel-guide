import { NextRequest, NextResponse } from 'next/server';

import { getBot } from '@/lib/bot';
import {
  enqueueDeliveryJob,
  getPurchaseByTributeId,
  markPurchaseRefunded,
  recordWebhookEvent,
  upsertPurchaseFromTribute,
} from '@/lib/db';
import { processDeliveryQueue } from '@/lib/delivery';
import { getGuideByTributeProductId } from '@/lib/catalog';
import {
  getTributeEventKey,
  parseTributeWebhook,
  verifyTributeSignature,
} from '@/lib/tribute';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const apiKey = process.env.TRIBUTE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TRIBUTE_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get('trbt-signature');

  if (!verifyTributeSignature(rawBody, signature, apiKey)) {
    return NextResponse.json({ error: 'Invalid Tribute signature' }, { status: 401 });
  }

  const event = parseTributeWebhook(rawBody);
  const eventKey = getTributeEventKey(event);
  const inserted = await recordWebhookEvent('tribute', event.name, eventKey, event);

  if (!inserted) {
    return NextResponse.json({ status: 'ok', duplicate: true });
  }

  const guide = getGuideByTributeProductId(event.payload.product_id);
  if (!guide) {
    return NextResponse.json(
      { error: `Unknown Tribute product id: ${event.payload.product_id}` },
      { status: 400 }
    );
  }

  if (event.name === 'digital_product_refunded') {
    const purchase = await getPurchaseByTributeId(event.payload.purchase_id);
    if (purchase) {
      await markPurchaseRefunded(
        purchase.id,
        event.payload.refund_reason || 'Tribute refund'
      );
    }

    return NextResponse.json({ status: 'ok' });
  }

  const purchase = await upsertPurchaseFromTribute(event, guide.slug, 'paid');
  await enqueueDeliveryJob(purchase.id, purchase.telegramUserId, 'tribute_payment');
  await processDeliveryQueue(getBot().api, { limit: 1, telegramUserId: purchase.telegramUserId });

  return NextResponse.json({ status: 'ok' });
}
