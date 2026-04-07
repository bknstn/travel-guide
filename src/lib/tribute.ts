import crypto from 'node:crypto';

import { TributeWebhookEvent } from '@/lib/types';

function normalizeSignature(signature: string) {
  return signature.trim().replace(/^sha256=/, '');
}

export function verifyTributeSignature(
  rawBody: string,
  signature: string | null,
  secret: string
) {
  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const normalizedExpected = Buffer.from(expected);
  const normalizedReceived = Buffer.from(normalizeSignature(signature));

  return (
    normalizedExpected.length === normalizedReceived.length &&
    crypto.timingSafeEqual(normalizedExpected, normalizedReceived)
  );
}

export function parseTributeWebhook(rawBody: string) {
  return JSON.parse(rawBody) as TributeWebhookEvent;
}

export function getTributeEventKey(event: TributeWebhookEvent) {
  const suffix =
    event.payload.purchase_id ||
    event.payload.transaction_id ||
    event.payload.product_id;

  return `${event.name}:${suffix}`;
}
