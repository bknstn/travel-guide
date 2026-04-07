import Link from 'next/link';

const supportEmail =
  process.env.SUPPORT_EMAIL ??
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
  'support@example.com';

export default function SupportPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8 lg:py-16">
      <div className="glass-card flex-1 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--secondary)]">
          Поддержка
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[color:var(--foreground)]">
          Если что-то пошло не так
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--secondary)]">
          Пишите, если бот не открывается, платеж не прошёл, файл не пришёл или вы хотите
          уточнить формат гайда перед покупкой.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <SupportCard title="Email" text={supportEmail} />
          <SupportCard title="Telegram" text="@your_support_handle" />
        </div>

        <div className="mt-8 space-y-3 text-sm leading-6 text-[color:var(--secondary)]">
          <p>Что ускоряет разбор: ссылка на гайд, время оплаты и ваш Telegram username.</p>
          <p>Если вы уже оплатили, приложите чек Tribute или скрин подтверждения.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="hero-button">
            На главную
          </Link>
          <Link href="/privacy" className="ghost-button">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </main>
  );
}

function SupportCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--secondary)]">{title}</p>
      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{text}</p>
    </div>
  );
}
