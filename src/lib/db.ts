import { Pool } from 'pg';

import {
  BotUserRecord,
  BotUserState,
  DeliveryJobRecord,
  PurchaseRecord,
  PurchaseStatus,
  TributeWebhookEvent,
} from '@/lib/types';

declare global {
  // eslint-disable-next-line no-var
  var __travelGuidePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __travelGuideSchemaPromise: Promise<void> | undefined;
}

function mapPurchase(row: Record<string, unknown>): PurchaseRecord {
  return {
    id: Number(row.id),
    guideSlug: String(row.guide_slug),
    tributePurchaseId: Number(row.tribute_purchase_id),
    tributeProductId: Number(row.tribute_product_id),
    tributeTransactionId: row.tribute_transaction_id
      ? Number(row.tribute_transaction_id)
      : null,
    telegramUserId: Number(row.telegram_user_id),
    telegramUsername: row.telegram_username ? String(row.telegram_username) : null,
    amount: Number(row.amount),
    currency: String(row.currency),
    status: row.status as PurchaseStatus,
    lastError: row.last_error ? String(row.last_error) : null,
    fulfilledAt: row.fulfilled_at ? new Date(String(row.fulfilled_at)) : null,
    telegramMessageId: row.telegram_message_id
      ? Number(row.telegram_message_id)
      : null,
    purchaseCreatedAt: row.purchase_created_at
      ? new Date(String(row.purchase_created_at))
      : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

function mapDeliveryJob(row: Record<string, unknown>): DeliveryJobRecord {
  return {
    id: Number(row.id),
    purchaseId: Number(row.purchase_id),
    telegramUserId: Number(row.telegram_user_id),
    status: row.status as DeliveryJobRecord['status'],
    attempts: Number(row.attempts),
    reason: row.reason ? String(row.reason) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    nextAttemptAt: row.next_attempt_at ? new Date(String(row.next_attempt_at)) : null,
    claimedAt: row.claimed_at ? new Date(String(row.claimed_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!global.__travelGuidePool) {
    global.__travelGuidePool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return global.__travelGuidePool;
}

export async function ensureSchema() {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!global.__travelGuideSchemaPromise) {
    global.__travelGuideSchemaPromise = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bot_users (
          id BIGSERIAL PRIMARY KEY,
          telegram_user_id BIGINT UNIQUE NOT NULL,
          username TEXT,
          first_name TEXT,
          last_name TEXT,
          locale TEXT,
          state TEXT NOT NULL DEFAULT 'idle',
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS webhook_events (
          id BIGSERIAL PRIMARY KEY,
          source TEXT NOT NULL,
          event_name TEXT NOT NULL,
          external_event_key TEXT NOT NULL UNIQUE,
          payload JSONB NOT NULL,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS guide_purchases (
          id BIGSERIAL PRIMARY KEY,
          guide_slug TEXT NOT NULL,
          tribute_purchase_id BIGINT NOT NULL UNIQUE,
          tribute_product_id BIGINT NOT NULL,
          tribute_transaction_id BIGINT,
          telegram_user_id BIGINT NOT NULL,
          telegram_username TEXT,
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL,
          last_error TEXT,
          fulfilled_at TIMESTAMPTZ,
          telegram_message_id BIGINT,
          purchase_created_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS delivery_jobs (
          id BIGSERIAL PRIMARY KEY,
          purchase_id BIGINT NOT NULL REFERENCES guide_purchases(id) ON DELETE CASCADE,
          telegram_user_id BIGINT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          reason TEXT,
          last_error TEXT,
          next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          claimed_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS delivery_jobs_open_purchase_idx
        ON delivery_jobs (purchase_id)
        WHERE status IN ('pending', 'processing');
      `);
    })();
  }

  await global.__travelGuideSchemaPromise;
}

export async function upsertBotUser(user: Omit<BotUserRecord, 'state'> & { state?: BotUserState }) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await ensureSchema();
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO bot_users (
        telegram_user_id,
        username,
        first_name,
        last_name,
        locale,
        state
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'idle'))
      ON CONFLICT (telegram_user_id) DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        locale = EXCLUDED.locale,
        last_seen_at = NOW(),
        state = COALESCE(EXCLUDED.state, bot_users.state),
        updated_at = NOW()
    `,
    [
      user.telegramUserId,
      user.username ?? null,
      user.firstName ?? null,
      user.lastName ?? null,
      user.locale ?? null,
      user.state ?? null,
    ]
  );
}

export async function getBotUserState(telegramUserId: number) {
  if (!isDatabaseConfigured()) {
    return 'idle' as BotUserState;
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    'SELECT state FROM bot_users WHERE telegram_user_id = $1',
    [telegramUserId]
  );

  return (result.rows[0]?.state as BotUserState | undefined) ?? 'idle';
}

export async function setBotUserState(
  telegramUserId: number,
  state: BotUserState
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO bot_users (telegram_user_id, state)
      VALUES ($1, $2)
      ON CONFLICT (telegram_user_id) DO UPDATE SET
        state = EXCLUDED.state,
        last_seen_at = NOW(),
        updated_at = NOW()
    `,
    [telegramUserId, state]
  );
}

export async function recordWebhookEvent(
  source: string,
  eventName: string,
  externalEventKey: string,
  payload: unknown
) {
  if (!isDatabaseConfigured()) {
    return true;
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO webhook_events (
        source,
        event_name,
        external_event_key,
        payload
      )
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (external_event_key) DO NOTHING
      RETURNING id
    `,
    [source, eventName, externalEventKey, JSON.stringify(payload)]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function upsertPurchaseFromTribute(
  event: TributeWebhookEvent,
  guideSlug: string,
  status: PurchaseStatus
) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO guide_purchases (
        guide_slug,
        tribute_purchase_id,
        tribute_product_id,
        tribute_transaction_id,
        telegram_user_id,
        telegram_username,
        amount,
        currency,
        status,
        purchase_created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (tribute_purchase_id) DO UPDATE SET
        guide_slug = EXCLUDED.guide_slug,
        tribute_product_id = EXCLUDED.tribute_product_id,
        tribute_transaction_id = COALESCE(EXCLUDED.tribute_transaction_id, guide_purchases.tribute_transaction_id),
        telegram_user_id = EXCLUDED.telegram_user_id,
        telegram_username = COALESCE(EXCLUDED.telegram_username, guide_purchases.telegram_username),
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = CASE
          WHEN guide_purchases.status = 'fulfilled' AND EXCLUDED.status = 'paid'
            THEN guide_purchases.status
          ELSE EXCLUDED.status
        END,
        purchase_created_at = COALESCE(EXCLUDED.purchase_created_at, guide_purchases.purchase_created_at),
        updated_at = NOW()
      RETURNING *
    `,
    [
      guideSlug,
      event.payload.purchase_id,
      event.payload.product_id,
      event.payload.transaction_id ?? null,
      event.payload.telegram_user_id,
      event.payload.telegram_username ?? null,
      event.payload.amount,
      event.payload.currency,
      status,
      event.payload.purchase_created_at ?? null,
    ]
  );

  return mapPurchase(result.rows[0]);
}

export async function markPurchaseFulfilled(
  purchaseId: number,
  telegramMessageId?: number
) {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE guide_purchases
      SET
        status = 'fulfilled',
        fulfilled_at = NOW(),
        telegram_message_id = COALESCE($2, telegram_message_id),
        last_error = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [purchaseId, telegramMessageId ?? null]
  );
}

export async function markPurchaseAwaitingStart(
  purchaseId: number,
  lastError: string
) {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE guide_purchases
      SET
        status = 'awaiting_bot_start',
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [purchaseId, lastError]
  );
}

export async function markPurchaseDeliveryFailed(
  purchaseId: number,
  lastError: string
) {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE guide_purchases
      SET
        status = 'delivery_failed',
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [purchaseId, lastError]
  );
}

export async function markPurchaseRefunded(purchaseId: number, reason: string) {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE guide_purchases
      SET
        status = 'refunded',
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [purchaseId, reason]
  );
}

export async function enqueueDeliveryJob(
  purchaseId: number,
  telegramUserId: number,
  reason: string
) {
  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
      WITH existing AS (
        SELECT 1
        FROM delivery_jobs
        WHERE purchase_id = $1
          AND status IN ('pending', 'processing')
      )
      INSERT INTO delivery_jobs (purchase_id, telegram_user_id, reason)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING *
    `,
    [purchaseId, telegramUserId, reason]
  );

  return result.rows[0] ? mapDeliveryJob(result.rows[0]) : null;
}

export async function claimDeliveryJobs(
  limit: number,
  telegramUserId?: number
) {
  await ensureSchema();
  const pool = getPool();
  const userId = telegramUserId ?? null;
  const result = await pool.query(
    `
      WITH candidates AS (
        SELECT id
        FROM delivery_jobs
        WHERE status = 'pending'
          AND next_attempt_at <= NOW()
          AND ($2::BIGINT IS NULL OR telegram_user_id = $2)
        ORDER BY next_attempt_at ASC, id ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE delivery_jobs
      SET
        status = 'processing',
        attempts = attempts + 1,
        claimed_at = NOW(),
        updated_at = NOW()
      WHERE id IN (SELECT id FROM candidates)
      RETURNING *
    `,
    [limit, userId]
  );

  return result.rows.map((row) => mapDeliveryJob(row));
}

export async function completeDeliveryJob(jobId: number) {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE delivery_jobs
      SET
        status = 'completed',
        completed_at = NOW(),
        last_error = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [jobId]
  );
}

export async function failDeliveryJob(
  jobId: number,
  lastError: string,
  minutesUntilRetry?: number
) {
  await ensureSchema();
  const pool = getPool();
  const status = minutesUntilRetry ? 'pending' : 'failed';

  await pool.query(
    `
      UPDATE delivery_jobs
      SET
        status = $2,
        last_error = $3,
        next_attempt_at = CASE
          WHEN $4::INTEGER IS NULL THEN next_attempt_at
          ELSE NOW() + ($4 || ' minutes')::INTERVAL
        END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [jobId, status, lastError, minutesUntilRetry ?? null]
  );
}

export async function getPurchaseById(purchaseId: number) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM guide_purchases WHERE id = $1 LIMIT 1',
    [purchaseId]
  );

  return result.rows[0] ? mapPurchase(result.rows[0]) : null;
}

export async function getPurchaseByTributeId(tributePurchaseId: number) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM guide_purchases WHERE tribute_purchase_id = $1 LIMIT 1',
    [tributePurchaseId]
  );

  return result.rows[0] ? mapPurchase(result.rows[0]) : null;
}

export async function listUserPurchases(telegramUserId: number) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM guide_purchases
      WHERE telegram_user_id = $1
        AND status IN ('paid', 'fulfilled', 'awaiting_bot_start', 'delivery_failed')
      ORDER BY created_at DESC
    `,
    [telegramUserId]
  );

  return result.rows.map((row) => mapPurchase(row));
}

export async function recoverPendingDeliveriesForUser(telegramUserId: number) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT gp.id
      FROM guide_purchases gp
      WHERE gp.telegram_user_id = $1
        AND gp.status IN ('awaiting_bot_start', 'delivery_failed')
        AND NOT EXISTS (
          SELECT 1
          FROM delivery_jobs dj
          WHERE dj.purchase_id = gp.id
            AND dj.status IN ('pending', 'processing')
        )
    `,
    [telegramUserId]
  );

  for (const row of result.rows) {
    await enqueueDeliveryJob(Number(row.id), telegramUserId, 'user_restart');
  }
}

export async function listRecentPurchases(limit = 30) {
  if (!isDatabaseConfigured()) {
    return [] as PurchaseRecord[];
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM guide_purchases
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map((row) => mapPurchase(row));
}

export async function listRecentDeliveryJobs(limit = 30) {
  if (!isDatabaseConfigured()) {
    return [] as DeliveryJobRecord[];
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM delivery_jobs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map((row) => mapDeliveryJob(row));
}
