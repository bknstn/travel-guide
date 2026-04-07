import Link from 'next/link';

import { GUIDE_CATALOG } from '@/lib/catalog';

const steps = [
  {
    title: 'Открываете бот',
    text: 'Переходите из Instagram по прямой ссылке и выбираете нужный город или страну.',
  },
  {
    title: 'Смотрите превью',
    text: 'Получаете бесплатный фрагмент PDF, чтобы понять стиль, глубину и формат гайда.',
  },
  {
    title: 'Оплачиваете и скачиваете',
    text: 'После Tribute бот отправляет полный PDF в личку или показывает ссылку на загрузку.',
  },
];

const guides = GUIDE_CATALOG.slice(0, 3).map((guide) => ({
  title: guide.title,
  category: guide.destination,
  price: guide.priceLabel,
  summary: guide.shortDescription,
}));

const botUsername = sanitizeTelegramUsername(
  process.env.TELEGRAM_BOT_USERNAME ??
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    'your_bot_username',
);
const botLink = `https://t.me/${botUsername}`;
const supportEmail =
  process.env.SUPPORT_EMAIL ??
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
  'support@example.com';

function sanitizeTelegramUsername(username: string) {
  return username.replace(/^@/, '').trim() || 'your_bot_username';
}

export default function TelegramLanding() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,_rgba(217,107,74,0.18),_transparent_45%),radial-gradient(circle_at_right,_rgba(30,111,106,0.15),_transparent_38%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--secondary)]">
              Telegram guide shop
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
              Travel Guide Bot
            </h1>
          </div>

          <Link href="/support" className="ghost-button text-sm">
            Поддержка
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div className="space-y-8">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--secondary)] shadow-sm backdrop-blur">
                Гайды в PDF, превью перед оплатой, доставка в Telegram
              </span>

              <div className="space-y-4">
                <h2 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-[color:var(--foreground)] sm:text-6xl lg:text-7xl">
                  Путеводители, которые покупают прямо из Telegram.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--secondary)] sm:text-lg">
                  Русскоязычный бот для продаж тревел-гайдов: короткое превью, быстрая
                  оплата через Tribute и мгновенная выдача PDF после успешного платежа.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={botLink} className="hero-button">
                Открыть бота
              </a>
              <a href="#catalog" className="ghost-button">
                Смотреть каталог
              </a>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <Stat label="До 20 гидов" value="Лёгкий каталог" />
              <Stat label="Preview first" value="PDF-фрагмент" />
              <Stat label="Delivery" value="В личку" />
            </dl>
          </div>

          <div className="glass-card relative space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[color:var(--secondary)]">Как выглядит продажа</p>
                <p className="text-xl font-semibold text-[color:var(--foreground)]">
                  Гайд + превью + оплата
                </p>
              </div>
              <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
                Tribute
              </span>
            </div>

            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--secondary)]">
                Пример покупки
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">Тбилиси на 3 дня</p>
                    <p className="text-sm text-[color:var(--secondary)]">
                      Превью, карта маршрута и практические советы
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--accent)]">9 €</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--background)]/70 p-3 text-sm text-[color:var(--secondary)]">
                  1. Открыть бот
                  <br />
                  2. Посмотреть preview.pdf
                  <br />
                  3. Оплатить и получить full.pdf
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoPill title="Оплата" text="Tribute checkout" />
              <InfoPill title="Формат" text="PDF для телефона" />
              <InfoPill title="Доставка" text="Telegram DM" />
              <InfoPill title="Поддержка" text={supportEmail} />
            </div>
          </div>
        </section>

        <section id="catalog" className="space-y-6 pb-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--secondary)]">
              Каталог
            </p>
            <h3 className="text-3xl font-semibold text-[color:var(--foreground)]">
              Небольшой набор, который легко читать и легко продавать
            </h3>
            <p className="text-[color:var(--secondary)]">
              В v1 каталог кодовый и компактный. Это удобно, когда гидов немного и важнее
              скорость запуска, чем сложная админка.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.title} className="glass-card flex h-full flex-col p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--secondary)]">
                  {guide.category}
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {guide.title}
                </h4>
                <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--secondary)]">
                  {guide.summary}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[color:var(--border)] pt-4">
                  <span className="text-sm text-[color:var(--secondary)]">Preview доступен</span>
                  <span className="text-lg font-semibold text-[color:var(--accent)]">
                    {guide.price}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-8 lg:grid-cols-[1fr_1fr]">
          <div className="glass-card p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--secondary)]">
              Как это работает
            </p>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10 font-semibold text-[color:var(--accent)]">
                    0{index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[color:var(--foreground)]">
                      {step.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--secondary)]">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--secondary)]">
              Почему это удобно
            </p>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--secondary)]">
              <p>
                Бот получает трафик из Instagram и ведёт пользователя в короткий,
                предсказуемый сценарий без лишних шагов.
              </p>
              <p>
                Превью PDF снижает риск покупки “вслепую”, а Tribute убирает ручную
                обработку платежей.
              </p>
              <p>
                После оплаты бот может сразу выдать полный файл в личные сообщения,
                поэтому продажа не зависит от внешнего сайта.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={botLink} className="hero-button">
                Начать в Telegram
              </a>
              <Link href="/privacy" className="ghost-button">
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[color:var(--border)] py-6 text-sm text-[color:var(--secondary)] sm:flex-row sm:items-center sm:justify-between">
          <p>Travel Guide Bot · PDF-гиды для Telegram</p>
          <div className="flex gap-4">
            <Link href="/support" className="hover:text-[color:var(--foreground)]">
              Поддержка
            </Link>
            <Link href="/privacy" className="hover:text-[color:var(--foreground)]">
              Privacy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card px-4 py-4">
      <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--secondary)]">
        {label}
      </dt>
      <dd className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{value}</dd>
    </div>
  );
}

function InfoPill({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--secondary)]">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{text}</p>
    </div>
  );
}
