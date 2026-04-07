# VPS-Hosted Telegram Guide Bot with Tribute

## Summary
- Pivot the repo from the current recommendation web app into a Telegram-first commerce bot for Russian-speaking users arriving from Instagram deep links.
- Use `Next.js 15 + TypeScript` for the app shell, Telegram webhook endpoints, small public pages, and a minimal ops UI.
- Use `grammy` for bot logic, `Postgres` on the VPS for runtime state, and the VPS filesystem for guide assets.
- Use `Tribute` for payments in v1. Do not add Stripe now; keep it as a later option for a separate web storefront.
- Use `Claude` only for optional guide selection/Q&A. Keep discovery, purchase, and fulfillment deterministic and button-driven.

## Architecture
- Deploy on the VPS with `Docker Compose` and four services:
  - `caddy`: HTTPS termination and reverse proxy
  - `web`: Next.js app in Node runtime
  - `worker`: lightweight Node worker for delivery retries and background jobs
  - `postgres`: Postgres 16 with a persistent volume
- Use Telegram webhook mode, not long polling.
- Expose two public HTTPS endpoints:
  - `POST /api/telegram/webhook`
  - `POST /api/tribute/webhook`
- Keep guide files on a mounted host volume, for example `/srv/travel-guide/data/guides/<slug>/`.
- Do not use managed DB/storage in v1. Add offsite backups to Backblaze B2 via `restic`.

## Product and Bot Behavior
- Replace the current personality-quiz product surface with:
  - a minimal landing page with “Open in Telegram”
  - public `support` and `privacy` pages
  - an ops page for purchases and retries
- Catalog is code-managed. Each guide has metadata plus three local assets:
  - `cover.jpg`
  - `preview.pdf`
  - `full.pdf`
- Store guide metadata in code with: `slug`, Russian title, short sales copy, tags, destination, price label, Tribute product ID, Tribute payment URL, Instagram deep-link alias, and a short curator-written synopsis for AI.
- Instagram links should use Telegram deep links like `t.me/<bot>?start=ig_<slug>`.
- Launch UX:
  - `/start` opens main menu
  - guide-specific deep links open that guide directly
  - buttons: `Каталог`, `Смотреть превью`, `Купить`, `Мои покупки`, `Помочь выбрать`, `Поддержка`
- Preview flow:
  - send cover + short copy + price
  - `Смотреть превью` sends the local `preview.pdf`
- Purchase flow:
  - `Купить` opens the Tribute payment URL for that guide
  - Tribute webhook confirms payment
  - worker sends `full.pdf` to the buyer in DM via `sendDocument`
- Post-payment behavior:
  - successful send marks purchase `fulfilled`
  - if Telegram delivery fails because the user has not started the bot or blocked it, mark `awaiting_bot_start`
  - on the next `/start`, re-check pending purchases and deliver automatically
  - `Мои покупки` re-sends previously purchased guides on demand
- AI behavior:
  - only enabled in `Помочь выбрать`
  - Claude receives catalog metadata and curator-written guide synopses; no PDF parsing or vector DB in v1
  - AI returns a structured shortlist; the app renders the actual buttons from catalog data only
  - if AI fails, fall back to deterministic tag-based matching

## Interfaces and Data
- Telegram commands: `/start`, `/catalog`, `/my_guides`, `/paysupport`
- Core tables:
  - `bot_users`: `telegram_user_id`, username, names, locale, first_seen_at, last_seen_at, state
  - `guide_purchases`: guide slug, Tribute purchase ID, Telegram user ID, amount/currency, status, delivered_at, telegram_message_id
  - `webhook_events`: source, event name, external event key, payload, processed_at
  - `delivery_jobs`: purchase ID, status, attempts, last_error, next_attempt_at
- Webhook rules:
  - Telegram webhook validates secret token/path secret
  - Tribute webhook verifies `trbt-signature` HMAC using the Tribute API key
  - all webhook processing is idempotent by external event key / purchase ID
- Required env vars:
  - `APP_BASE_URL`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_BOT_USERNAME`
  - `TELEGRAM_WEBHOOK_SECRET`
  - `TRIBUTE_API_KEY`
  - `DATABASE_URL`
  - `ANTHROPIC_API_KEY`
  - `OPS_BASIC_AUTH_USER`
  - `OPS_BASIC_AUTH_PASSWORD`
  - `RESTIC_REPOSITORY`
  - `RESTIC_PASSWORD`
  - Backblaze B2 credentials

## Deployment and Ops
- Provision one subdomain, for example `bot.<domain>`, and terminate TLS in Caddy.
- Build the Next.js app in standalone mode and run both `web` and `worker` from the same image.
- Mount persistent volumes for:
  - Postgres data
  - guide assets
  - local backup dumps
- Backups:
  - nightly `pg_dump -Fc`
  - nightly `restic backup` of the latest DB dump plus the guides directory to Backblaze B2
  - retention: `7 daily`, `4 weekly`, `6 monthly`
  - monthly restore test into a disposable Postgres container
- Protect the ops UI with HTTP Basic Auth at the reverse proxy level.
- Do not run a local Telegram Bot API server in v1; the standard Telegram Bot API is sufficient because guides stay under 50 MB.

## Test Plan
- Unit tests for:
  - Telegram deep-link parsing
  - guide lookup and catalog validation
  - Tribute signature verification
  - webhook idempotency
  - delivery state transitions
- Integration tests for:
  - Instagram deep link -> guide detail message
  - preview send
  - Tribute payment webhook -> single purchase row -> single PDF delivery
  - duplicate Tribute webhook does not duplicate delivery
  - failed delivery becomes `awaiting_bot_start` and is delivered on the next `/start`
  - `Мои покупки` re-delivers owned guides only
  - AI failure falls back to deterministic recommendations
- Manual acceptance:
  - generic `/start`
  - guide deep link from Instagram
  - preview PDF received
  - real low-price purchase through Tribute
  - full PDF arrives in DM
  - refunds/support flow is visible in ops

## Assumptions and Defaults
- v1 is Russian-only.
- Guide count stays under 20, so a code-managed catalog is enough.
- Full PDFs stay under 50 MB, so Telegram DM delivery is viable.
- Tribute products are created manually in the Tribute dashboard; IDs and payment URLs are then added to the catalog config.
- Direct PDF delivery is the fulfillment model; channel-based access is out of scope.
- Stripe is intentionally deferred until there is a separate need for a non-Telegram checkout path.

## References
- Telegram deep links: [core.telegram.org/method/messages.startBot](https://core.telegram.org/method/messages.startBot)
- Telegram digital goods / Stars: [core.telegram.org/bots/payments-stars](https://core.telegram.org/bots/payments-stars)
- Telegram Bot API file limits: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)
- Tribute webhooks: [wiki.tribute.tg/ru/api-dokumentaciya/vebkhuki](https://wiki.tribute.tg/ru/api-dokumentaciya/vebkhuki)
- Tribute digital product integration: [wiki.tribute.tg/ru/for-content-creators/digital-product/api-integration](https://wiki.tribute.tg/ru/for-content-creators/digital-product/api-integration)
