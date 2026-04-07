import {
  Bot,
  Context,
  InlineKeyboard,
  InputFile,
} from 'grammy';

import {
  GUIDE_CATALOG,
  getGuideBySlug,
  getGuideByStartParam,
} from '@/lib/catalog';
import { recommendGuidesFromBrief } from '@/lib/claude';
import {
  getBotUserState,
  listUserPurchases,
  recoverPendingDeliveriesForUser,
  setBotUserState,
  upsertBotUser,
} from '@/lib/db';
import { processDeliveryQueue, redeliverOwnedGuide, sendGuideDocument } from '@/lib/delivery';
import { getGuideAssetPath, guideAssetExists } from '@/lib/guide-assets';

declare global {
  // eslint-disable-next-line no-var
  var __travelGuideBot: Bot<Context> | undefined;
}

function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text('Каталог', 'menu:catalog')
    .text('Мои покупки', 'menu:my-guides')
    .row()
    .text('Помочь выбрать', 'help:choose')
    .text('Поддержка', 'menu:support');
}

function guideKeyboard(slug: string, tributePaymentUrl: string) {
  return new InlineKeyboard()
    .text('Смотреть превью', `preview:${slug}`)
    .url('Купить', tributePaymentUrl)
    .row()
    .text('Каталог', 'menu:catalog')
    .text('Помочь выбрать', 'help:choose');
}

function catalogKeyboard() {
  const keyboard = new InlineKeyboard();

  GUIDE_CATALOG.forEach((guide) => {
    keyboard.text(guide.title, `guide:${guide.slug}`).row();
  });

  keyboard.text('Помочь выбрать', 'help:choose').text('Мои покупки', 'menu:my-guides');
  return keyboard;
}

function purchasesKeyboard(slugs: string[]) {
  const keyboard = new InlineKeyboard();

  slugs.forEach((slug) => {
    const guide = getGuideBySlug(slug);
    if (guide) {
      keyboard.text(`Скачать: ${guide.title}`, `library:${guide.slug}`).row();
    }
  });

  keyboard.text('Каталог', 'menu:catalog').text('Поддержка', 'menu:support');
  return keyboard;
}

function supportText() {
  return [
    'Поддержка платежей и доступа',
    '',
    'Если оплата прошла, а PDF не пришел, нажмите /start еще раз или откройте «Мои покупки».',
    'Для ручной помощи: support@travel-guide.local',
  ].join('\n');
}

async function sendMainMenu(ctx: Context) {
  await ctx.reply(
    [
      'Готово. Это бот с PDF-гайдами по поездкам.',
      '',
      'Здесь можно открыть превью, оплатить нужный гайд через Tribute и получить полный PDF прямо в этот чат.',
    ].join('\n'),
    {
      reply_markup: mainMenuKeyboard(),
    }
  );
}

async function sendCatalog(ctx: Context) {
  const lines = GUIDE_CATALOG.map(
    (guide, index) =>
      `${index + 1}. ${guide.title} · ${guide.destination}\n${guide.shortDescription}\n${guide.priceLabel}`
  );

  await ctx.reply(lines.join('\n\n'), {
    reply_markup: catalogKeyboard(),
  });
}

async function sendGuideCard(ctx: Context, slug: string) {
  const guide = getGuideBySlug(slug);

  if (!guide) {
    await ctx.reply('Не удалось найти этот гайд. Откройте каталог и выберите другой.', {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const text = [
    `${guide.title}`,
    `${guide.destination}`,
    '',
    guide.fullDescription,
    '',
    `Цена: ${guide.priceLabel}`,
    'После оплаты PDF будет доставлен сюда автоматически.',
  ].join('\n');

  if (guideAssetExists(guide, 'cover')) {
    await ctx.replyWithPhoto(new InputFile(getGuideAssetPath(guide, 'cover')), {
      caption: text,
      reply_markup: guideKeyboard(guide.slug, guide.tributePaymentUrl),
    });
    return;
  }

  await ctx.reply(text, {
    reply_markup: guideKeyboard(guide.slug, guide.tributePaymentUrl),
  });
}

async function sendMyGuides(ctx: Context) {
  if (!ctx.from) {
    return;
  }

  const purchases = await listUserPurchases(ctx.from.id);
  if (purchases.length === 0) {
    await ctx.reply('Пока нет оплаченных гайдов. Откройте каталог и выберите подходящий.', {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const uniqueSlugs = [...new Set(purchases.map((purchase) => purchase.guideSlug))];
  const lines = uniqueSlugs
    .map((slug) => {
      const guide = getGuideBySlug(slug);
      return guide ? `• ${guide.title}` : null;
    })
    .filter(Boolean);

  await ctx.reply(`Ваши покупки:\n\n${lines.join('\n')}`, {
    reply_markup: purchasesKeyboard(uniqueSlugs),
  });
}

async function sendGuidePreview(ctx: Context, slug: string) {
  const guide = getGuideBySlug(slug);

  if (!guide) {
    await ctx.reply('Не удалось найти превью для этого гайда.');
    return;
  }

  try {
    await sendGuideDocument(ctx.api, ctx.chat!.id, slug, 'preview');
  } catch (error) {
    await ctx.reply(
      error instanceof Error
        ? error.message
        : 'Не удалось отправить превью. Попробуйте позже.'
    );
  }
}

async function handleGuideSelectionHelp(ctx: Context, userBrief: string) {
  const recommendations = await recommendGuidesFromBrief(userBrief);

  if (recommendations.length === 0) {
    await ctx.reply('Пока не получилось подобрать гайд. Попробуйте описать поездку чуть подробнее.', {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  for (const item of recommendations) {
    const guide = getGuideBySlug(item.slug);
    if (!guide) {
      continue;
    }

    await ctx.reply(
      [`${guide.title}`, item.reason, `Цена: ${guide.priceLabel}`].join('\n\n'),
      {
        reply_markup: guideKeyboard(guide.slug, guide.tributePaymentUrl),
      }
    );
  }
}

function registerBot(bot: Bot<Context>) {
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await upsertBotUser({
        telegramUserId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        locale: ctx.from.language_code,
      });
    }

    await next();
  });

  bot.command('start', async (ctx) => {
    const payload = ctx.message?.text?.split(/\s+/, 2)[1] ?? null;

    if (ctx.from) {
      await setBotUserState(ctx.from.id, 'idle');
      await recoverPendingDeliveriesForUser(ctx.from.id);
      await processDeliveryQueue(ctx.api, {
        limit: 5,
        telegramUserId: ctx.from.id,
      });
    }

    const guide = getGuideByStartParam(payload);

    if (guide) {
      await sendGuideCard(ctx, guide.slug);
      return;
    }

    await sendMainMenu(ctx);
  });

  bot.command('catalog', sendCatalog);
  bot.command('my_guides', sendMyGuides);
  bot.command('paysupport', async (ctx) => {
    await ctx.reply(supportText(), {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.callbackQuery('menu:catalog', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendCatalog(ctx);
  });

  bot.callbackQuery('menu:my-guides', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendMyGuides(ctx);
  });

  bot.callbackQuery('menu:support', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(supportText(), {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.callbackQuery('help:choose', async (ctx) => {
    await ctx.answerCallbackQuery();

    if (ctx.from) {
      await setBotUserState(ctx.from.id, 'awaiting_ai_brief');
    }

    await ctx.reply(
      'Опишите, что вы хотите от поездки: темп, город, настроение, бюджет, еда, районы. Я предложу подходящие гайды.',
      {
        reply_markup: new InlineKeyboard().text('Каталог', 'menu:catalog'),
      }
    );
  });

  bot.callbackQuery(/^guide:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendGuideCard(ctx, ctx.match[1]);
  });

  bot.callbackQuery(/^preview:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendGuidePreview(ctx, ctx.match[1]);
  });

  bot.callbackQuery(/^library:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();

    if (!ctx.from) {
      return;
    }

    try {
      await redeliverOwnedGuide(ctx.api, ctx.from.id, ctx.match[1]);
    } catch (error) {
      await ctx.reply(
        error instanceof Error
          ? error.message
          : 'Не удалось повторно отправить PDF.'
      );
    }
  });

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (!ctx.from || text.startsWith('/')) {
      return;
    }

    const state = await getBotUserState(ctx.from.id);

    if (state !== 'awaiting_ai_brief') {
      await ctx.reply('Используйте кнопки ниже, чтобы открыть каталог или посмотреть покупки.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    await setBotUserState(ctx.from.id, 'idle');
    await handleGuideSelectionHelp(ctx, text);
  });
}

export function getBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  if (!global.__travelGuideBot) {
    const bot = new Bot<Context>(process.env.TELEGRAM_BOT_TOKEN);
    registerBot(bot);
    global.__travelGuideBot = bot;
  }

  return global.__travelGuideBot;
}
