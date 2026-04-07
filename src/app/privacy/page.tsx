import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8 lg:py-16">
      <div className="glass-card flex-1 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--secondary)]">
          Политика конфиденциальности
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[color:var(--foreground)]">
          Какие данные мы храним
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--secondary)]">
          Бот хранит только то, что нужно для работы каталога, оплаты и повторной выдачи
          купленных PDF-гайдов.
        </p>

        <div className="mt-8 space-y-4 text-sm leading-7 text-[color:var(--secondary)]">
          <PrivacyItem title="Telegram данные" text="Telegram user id, username, имя и язык интерфейса." />
          <PrivacyItem title="Покупки" text="Ссылка на гайд, статус оплаты, дата выдачи и технический идентификатор платежа." />
          <PrivacyItem title="Служебные логи" text="События вебхуков и ошибки доставки, чтобы восстановить файл после сбоя." />
          <PrivacyItem title="Что не храним" text="Мы не сохраняем карточные данные и не используем их для сторонних целей." />
        </div>

        <div className="mt-8 space-y-3 text-sm leading-6 text-[color:var(--secondary)]">
          <p>Если вы хотите удалить историю взаимодействия, напишите в поддержку.</p>
          <p>Эта страница должна быть обновлена, когда появятся точные реквизиты оператора и юрлица.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="hero-button">
            На главную
          </Link>
          <Link href="/support" className="ghost-button">
            Поддержка
          </Link>
        </div>
      </div>
    </main>
  );
}

function PrivacyItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--secondary)]">{title}</p>
      <p className="mt-2 text-base text-[color:var(--foreground)]">{text}</p>
    </div>
  );
}
