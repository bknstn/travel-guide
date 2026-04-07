/**
 * @jest-environment node
 */

import crypto from 'node:crypto';

import {
  getTributeEventKey,
  parseTributeWebhook,
  verifyTributeSignature,
} from '@/lib/tribute';

describe('tribute webhook helpers', () => {
  const rawBody = JSON.stringify({
    name: 'new_digital_product',
    created_at: '2026-04-07T10:00:00.000Z',
    sent_at: '2026-04-07T10:00:01.000Z',
    payload: {
      product_id: 101,
      amount: 149000,
      currency: 'RUB',
      telegram_user_id: 42,
      purchase_id: 999,
      transaction_id: 1234,
    },
  });

  const secret = 'tribute-secret';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  it('validates a matching HMAC signature', () => {
    expect(verifyTributeSignature(rawBody, signature, secret)).toBe(true);
    expect(verifyTributeSignature(rawBody, `sha256=${signature}`, secret)).toBe(true);
  });

  it('builds a stable event key', () => {
    const event = parseTributeWebhook(rawBody);
    expect(getTributeEventKey(event)).toBe('new_digital_product:999');
  });
});
