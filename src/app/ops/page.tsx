import { revalidatePath } from 'next/cache';

import { listRecentDeliveryJobs, listRecentPurchases } from '@/lib/db';
import { requeuePurchaseDelivery } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

async function retryDelivery(formData: FormData) {
  'use server';

  const purchaseIdValue = formData.get('purchaseId');
  if (!purchaseIdValue) {
    return;
  }

  const purchaseId = Number(purchaseIdValue);
  if (Number.isNaN(purchaseId)) {
    return;
  }

  await requeuePurchaseDelivery(purchaseId);
  revalidatePath('/ops');
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

export default async function OpsPage() {
  const [purchases, jobs] = await Promise.all([
    listRecentPurchases(25),
    listRecentDeliveryJobs(25),
  ]);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12 text-stone-50">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Ops</p>
          <h1 className="text-4xl font-semibold">Покупки и доставка</h1>
          <p className="max-w-2xl text-sm text-stone-300">
            Внутренняя панель для проверки платежей Tribute и повторного запуска
            отправки PDF.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-medium">Последние покупки</h2>
              <span className="text-sm text-stone-400">{purchases.length} записей</span>
            </div>

            <div className="space-y-4">
              {purchases.length === 0 ? (
                <p className="text-sm text-stone-400">Покупок пока нет.</p>
              ) : (
                purchases.map((purchase) => (
                  <article
                    key={purchase.id}
                    className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-medium">{purchase.guideSlug}</h3>
                        <p className="text-sm text-stone-400">
                          Telegram ID: {purchase.telegramUserId}
                        </p>
                        <p className="text-sm text-stone-400">
                          Purchase ID: {purchase.tributePurchaseId}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-800 px-3 py-1 text-xs uppercase tracking-wide text-amber-200">
                        {purchase.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-stone-300">
                      <p>
                        {purchase.amount} {purchase.currency}
                      </p>
                      <p>Создано: {formatDate(purchase.createdAt)}</p>
                      <p>Доставлено: {formatDate(purchase.fulfilledAt)}</p>
                      {purchase.lastError ? (
                        <p className="text-rose-300">Ошибка: {purchase.lastError}</p>
                      ) : null}
                    </div>

                    {purchase.status !== 'fulfilled' && purchase.status !== 'refunded' ? (
                      <form action={retryDelivery} className="mt-4">
                        <input type="hidden" name="purchaseId" value={purchase.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-300 px-4 py-2 text-sm text-amber-200 transition hover:bg-amber-300 hover:text-stone-950"
                        >
                          Повторить отправку
                        </button>
                      </form>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-medium">Очередь доставки</h2>
              <span className="text-sm text-stone-400">{jobs.length} задач</span>
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <p className="text-sm text-stone-400">Очередь пуста.</p>
              ) : (
                jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">Задача #{job.id}</p>
                      <span className="rounded-full bg-stone-800 px-3 py-1 text-xs uppercase tracking-wide text-sky-200">
                        {job.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-stone-300">
                      <p>Purchase ID: {job.purchaseId}</p>
                      <p>Telegram ID: {job.telegramUserId}</p>
                      <p>Попыток: {job.attempts}</p>
                      <p>Следующая попытка: {formatDate(job.nextAttemptAt)}</p>
                      {job.lastError ? (
                        <p className="text-rose-300">Ошибка: {job.lastError}</p>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
