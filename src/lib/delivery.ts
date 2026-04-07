import { Api, GrammyError, HttpError, InlineKeyboard, InputFile } from 'grammy';

import { getGuideBySlug } from '@/lib/catalog';
import {
  claimDeliveryJobs,
  completeDeliveryJob,
  enqueueDeliveryJob,
  failDeliveryJob,
  getPurchaseById,
  listUserPurchases,
  markPurchaseAwaitingStart,
  markPurchaseDeliveryFailed,
  markPurchaseFulfilled,
} from '@/lib/db';
import { getGuideAssetPath, guideAssetExists } from '@/lib/guide-assets';

function deliveryCaption(title: string) {
  return `Ваш гайд «${title}» готов.\n\nЕсли захотите, откройте «Мои покупки» и скачайте его снова в любой момент.`;
}

function isChatStartError(error: unknown) {
  const message =
    error instanceof GrammyError
      ? error.description
      : error instanceof HttpError
        ? error.message
        : error instanceof Error
          ? error.message
          : '';

  const normalized = message.toLowerCase();
  return (
    normalized.includes('chat not found') ||
    normalized.includes('forbidden') ||
    normalized.includes('bot was blocked by the user') ||
    normalized.includes('bot can\'t initiate conversation')
  );
}

function getRetryDelayMinutes(attempts: number) {
  if (attempts <= 1) {
    return 5;
  }

  if (attempts === 2) {
    return 15;
  }

  if (attempts === 3) {
    return 30;
  }

  return 60;
}

export async function sendGuideDocument(
  api: Api,
  telegramUserId: number,
  guideSlug: string,
  mode: 'preview' | 'full'
) {
  const guide = getGuideBySlug(guideSlug);
  if (!guide) {
    throw new Error(`Unknown guide: ${guideSlug}`);
  }

  if (!guideAssetExists(guide, mode === 'preview' ? 'preview' : 'full')) {
    throw new Error(`Missing ${mode} asset for ${guide.slug}`);
  }

  const assetPath = getGuideAssetPath(
    guide,
    mode === 'preview' ? 'preview' : 'full'
  );

  return api.sendDocument(telegramUserId, new InputFile(assetPath), {
    caption:
      mode === 'preview'
        ? `Превью гайда «${guide.title}».\n\nПолную версию можно купить через Tribute.`
        : deliveryCaption(guide.title),
    reply_markup:
      mode === 'full'
        ? new InlineKeyboard().text('Мои покупки', 'menu:my-guides').row().text(
            'Каталог',
            'menu:catalog'
          )
        : undefined,
  });
}

export async function processDeliveryQueue(
  api: Api,
  options?: { limit?: number; telegramUserId?: number }
) {
  const jobs = await claimDeliveryJobs(options?.limit ?? 5, options?.telegramUserId);

  for (const job of jobs) {
    const purchase = await getPurchaseById(job.purchaseId);

    if (!purchase) {
      await failDeliveryJob(job.id, 'Purchase not found');
      continue;
    }

    if (purchase.status === 'fulfilled') {
      await completeDeliveryJob(job.id);
      continue;
    }

    try {
      const response = await sendGuideDocument(
        api,
        purchase.telegramUserId,
        purchase.guideSlug,
        'full'
      );

      await markPurchaseFulfilled(purchase.id, response.message_id);
      await completeDeliveryJob(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delivery error';

      if (isChatStartError(error)) {
        await markPurchaseAwaitingStart(purchase.id, message);
        await failDeliveryJob(job.id, message);
        continue;
      }

      await markPurchaseDeliveryFailed(purchase.id, message);
      await failDeliveryJob(job.id, message, getRetryDelayMinutes(job.attempts));
    }
  }

  return jobs.length;
}

export async function requeuePurchaseDelivery(purchaseId: number) {
  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) {
    throw new Error('Purchase not found');
  }

  return enqueueDeliveryJob(
    purchase.id,
    purchase.telegramUserId,
    'manual_ops_retry'
  );
}

export async function redeliverOwnedGuide(
  api: Api,
  telegramUserId: number,
  guideSlug: string
) {
  const purchases = await listUserPurchases(telegramUserId);
  const hasAccess = purchases.some((purchase) => purchase.guideSlug === guideSlug);

  if (!hasAccess) {
    throw new Error('Guide not owned by user');
  }

  return sendGuideDocument(api, telegramUserId, guideSlug, 'full');
}
