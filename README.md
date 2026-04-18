# Travel Guide Bot

Telegram bot for selling travel guide PDFs with:

- Instagram deep links into the bot
- one Tribute payment per guide
- Tribute payment links and webhook confirmation
- automatic PDF delivery in Telegram chat
- a small ops page for purchase and delivery retries
- VPS-first deployment with local Postgres and offsite backups

The product/infra plan is documented in [travel-guide-bot.md](./travel-guide-bot.md).

## Tech Stack

- `Next.js 15` with App Router
- `TypeScript`
- `grammy` for Telegram bot handling
- `Postgres` via `pg`
- `Docker Compose + Caddy` for VPS deployment

## What’s In The Repo

- Public site:
  - `/` landing page with Telegram CTA
  - `/support`
  - `/privacy`
- Internal page:
  - `/ops` purchase and delivery dashboard
- Webhooks:
  - `POST /api/telegram/webhook`
  - `POST /api/tribute/webhook`
  - `GET /api/health`
- Runtime:
  - guide catalog in code
  - local PDF/cover asset lookup
  - Tribute signature verification
  - Postgres-backed purchases and delivery jobs
  - worker loop for retrying PDF delivery

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts
│   │   ├── telegram/webhook/route.ts
│   │   └── tribute/webhook/route.ts
│   ├── ops/page.tsx
│   ├── privacy/page.tsx
│   ├── support/page.tsx
│   └── page.tsx
├── components/
│   └── landing/TelegramLanding.tsx
├── lib/
│   ├── bot.ts
│   ├── catalog.ts
│   ├── db.ts
│   ├── delivery.ts
│   ├── guide-assets.ts
│   ├── tribute.ts
│   └── types.ts
└── worker.ts
```

## Guide Assets

Guide metadata is code-managed in [`src/lib/catalog.ts`](./src/lib/catalog.ts).

Each guide expects a local folder:

```text
data/guides/<slug>/
├── cover.jpg
└── full.pdf
```

At runtime the app reads assets from:

- `GUIDES_ROOT` if set
- otherwise `GUIDE_ASSETS_DIR`
- otherwise `./data/guides`

If `full.pdf` is missing, Telegram delivery will fail for that guide.

## Environment Variables

Copy `env.example` to `.env` for Docker/VPS deployment.

Main variables:

- `APP_DOMAIN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- `TELEGRAM_WEBHOOK_SECRET`
- `TRIBUTE_API_KEY`
- `SUPPORT_EMAIL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `GUIDES_ROOT`
- `GUIDE_ASSETS_DIR`
- `BACKUP_OUTPUT_DIR`
- `CADDY_EMAIL`
- `OPS_BASIC_AUTH_USER`
- `OPS_BASIC_AUTH_PASSWORD`
- `RESTIC_REPOSITORY`
- `RESTIC_PASSWORD`
- `B2_ACCOUNT_ID`
- `B2_ACCOUNT_KEY`

Notes:

- `OPS_BASIC_AUTH_USER` and `OPS_BASIC_AUTH_PASSWORD` protect `/ops` through [`middleware.ts`](./middleware.ts).
- `NEXT_PUBLIC_*` values are for public page links/text. Server runtime still uses the non-public variables.

## Local Development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Run the worker in a second terminal if you want delivery retries locally:

```bash
npm run worker
```

You will also need:

- a reachable Postgres database
- a `.env.local` or `.env` with the required runtime values
- guide assets in `data/guides`

The bot/webhook logic is implemented, but Telegram and Tribute won’t call your local machine unless you expose it publicly and register the webhook URLs.

## Tribute + Telegram Flow

1. User opens the bot from Instagram with a deep link like `t.me/<bot>?start=ig_<alias>`.
2. Bot shows the matching guide card and starts a single-guide checkout flow.
3. User clicks the Tribute payment link.
4. Tribute sends a signed webhook to `POST /api/tribute/webhook`.
5. The app stores the purchase, enqueues delivery, and tries to send `full.pdf` to the buyer.
6. If delivery fails because the user has not started the bot or blocked it, the purchase stays pending and is retried later or after the next `/start`.

## NPM Scripts

```bash
npm run dev
npm run build
npm run start
npm run worker
npm run lint
npm test -- --runInBand
```

## VPS Deployment

The production stack is:

- `web`: Next.js app
- `worker`: queue processor
- `postgres`: local Postgres 16
- `caddy`: HTTPS reverse proxy

Main deployment files:

- [`Dockerfile`](./Dockerfile)
- [`docker-compose.yml`](./docker-compose.yml)
- [`Caddyfile`](./Caddyfile)
- [`scripts/worker.mjs`](./scripts/worker.mjs)

Typical VPS flow:

1. Provision a VPS with Docker and Docker Compose.
2. Create host directories for guide assets and backups, for example:
   - `/srv/travel-guide/data/guides`
   - `/srv/travel-guide/data/backups`
3. Copy the repo to the VPS.
4. Create `.env` from `env.example`.
5. Put real guide assets on disk.
6. Start the stack:

```bash
docker compose up -d --build
```

7. Register the Telegram webhook against:

```text
https://<your-domain>/api/telegram/webhook
```

8. Register the Tribute webhook against:

```text
https://<your-domain>/api/tribute/webhook
```

## Backups

Host-side backup helpers:

- [`scripts/backup.sh`](./scripts/backup.sh)
- [`scripts/restore-db.sh`](./scripts/restore-db.sh)

Backup script behavior:

- creates a `pg_dump` from the local Postgres container
- stores the latest dump under `data/backups/postgres`
- sends the latest dump and guide assets to Restic
- prunes old snapshots with daily/weekly/monthly retention

Example cron usage on the VPS:

```bash
bash /srv/travel-guide/app/scripts/backup.sh
```

## Testing

Run:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Current tests cover:

- catalog helpers
- Tribute webhook helpers
- landing page messaging for the single-guide checkout flow

## Operational Notes

- Tribute product IDs and payment links are configured in [`src/lib/catalog.ts`](./src/lib/catalog.ts), with one product/payment URL per guide.
- The app creates database tables lazily at runtime in [`src/lib/db.ts`](./src/lib/db.ts). There is no separate migration tool yet.
- `/ops` is intentionally dynamic and reads live purchase/job state from Postgres.
- Refund webhooks mark purchases as refunded, but access revocation is intentionally simple in v1 because PDFs are delivered as files.
