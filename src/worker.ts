import { getBot } from '@/lib/bot';
import { ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { processDeliveryQueue } from '@/lib/delivery';

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 15000);
const BATCH_SIZE = Number(process.env.WORKER_BATCH_SIZE ?? 10);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required for the worker');
  }

  await ensureSchema();
  const bot = getBot();

  let keepRunning = true;

  process.on('SIGINT', () => {
    keepRunning = false;
  });

  process.on('SIGTERM', () => {
    keepRunning = false;
  });

  while (keepRunning) {
    try {
      await processDeliveryQueue(bot.api, { limit: BATCH_SIZE });
    } catch (error) {
      console.error('Worker iteration failed', error);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});
