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
import {
  listUserPurchases,
  recoverPendingDeliveriesForUser,
  upsertBotUser,
} from '@/lib/db';
import { processDeliveryQueue, redeliverOwnedGuide } from '@/lib/delivery';
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
    .text('Поддержка', 'menu:support');
}

async function buildGuideKeyboard(
  telegramUserId: number | undefined,
  slug: string,
  tributePaymentUrl: string
) {
  const ownsGuide = telegramUserId
    ? (await listUserPurchases(telegramUserId)).some(
        (purchase) => purchase.guideSlug === slug
      )
    : false;

  const keyboard = new InlineKeyboard();

  if (ownsGuide) {
    keyboard.text('Скачать PDF', `library:${slug}`);
  } else {
    keyboard.url('Оплатить', tributePaymentUrl);
  }

  keyboard.row().text('Каталог', 'menu:catalog');

  if (ownsGuide) {
    keyboard.text('Мои покупки', 'menu:my-guides');
  } else {
    keyboard.text('Поддержка', 'menu:support');
  }

  return { keyboard, ownsGuide };
}

function catalogKeyboard() {
  const keyboard = new InlineKeyboard();

  GUIDE_CATALOG.forEach((guide) => {
    keyboard.text(guide.title, `guide:${guide.slug}`).row();
  });

  keyboard.text('Мои покупки', 'menu:my-guides').text('Поддержка', 'menu:support');
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
      'Здесь можно выбрать нужный гайд, оплатить его через Tribute и получить PDF прямо в этот чат.',
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

  const { keyboard, ownsGuide } = await buildGuideKeyboard(
    ctx.from?.id,
    guide.slug,
    guide.tributePaymentUrl
  );

  const text = [
    `${guide.title}`,
    `${guide.destination}`,
    '',
    guide.fullDescription,
    '',
    `Цена: ${guide.priceLabel}`,
    ownsGuide
      ? 'Этот PDF уже есть в ваших покупках. Можно скачать его снова ниже.'
      : 'Один платеж = один гайд. После оплаты PDF будет доставлен сюда автоматически.',
  ].join('\n');

  if (guideAssetExists(guide, 'cover')) {
    await ctx.replyWithPhoto(new InputFile(getGuideAssetPath(guide, 'cover')), {
      caption: text,
      reply_markup: keyboard,
    });
    return;
  }

  await ctx.reply(text, {
    reply_markup: keyboard,
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

  bot.callbackQuery(/^guide:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendGuideCard(ctx, ctx.match[1]);
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
    if (!ctx.from || ctx.message.text.trim().startsWith('/')) {
      return;
    }

    await ctx.reply('Используйте кнопки ниже, чтобы открыть каталог, посмотреть покупки или написать в поддержку.', {
      reply_markup: mainMenuKeyboard(),
    });
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
