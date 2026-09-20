# Backstop

Backstop is a consumer purchase-intelligence prototype that inspects a public shopping URL before purchase, explains transaction friction and risk signals, and can track key purchase deadlines after the user buys.

## Current capabilities

- Responsive React + TypeScript + Material UI interface
- Real URL scanner API
- Static HTML product and merchant extraction
- Conditional Chromium rendering for JavaScript-heavy storefronts
- Product name and price extraction
- Return, warranty and recurring-commitment analysis
- Payment-method detection
- RDAP domain-registration intelligence
- DNS and TLS checks
- Google Web Risk threat screening when configured
- Merchant legal-entity extraction
- Free GLEIF LEI lookup
- Evidence-coverage reporting
- Explainable heuristic risk scoring
- Purchase-date and delivery-date capture
- Calculated return, warranty and renewal deadlines
- Dockerized PostgreSQL protected-purchase persistence
- Dynamic protection dashboard
- Protected-purchase detail view and event timeline
- Saved scan-evidence snapshots for newly protected purchases
- Editable protection dates with deadline recalculation
- Purchase lifecycle states: active, kept, returned and refunded
- PostgreSQL-backed deadline reminder generation
- Configurable 3, 7, 14 or 30-day reminder windows
- In-app notification center with unread/read state
- Optional browser desktop alerts while Backstop is open

## Run locally

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Apply database migrations:

```bash
npm run db:migrate
```

Start Backstop:

```bash
npm run dev
```

Then open the Vite URL, normally `http://localhost:5173`.

The default Docker host binding is `127.0.0.1:55432`, mapped to PostgreSQL `5432` inside the container. Use `postgresql://backstop:backstop@127.0.0.1:55432/backstop` for the local API. Set `DATABASE_URL` in `.env` only if you want a different local PostgreSQL instance.

## Verify the build

```bash
npm run typecheck
npm run build
```

## Environment

Create a project-root `.env` file when needed.

```env
GOOGLE_WEB_RISK_API_KEY=
BACKSTOP_BROWSER_FALLBACK=1
```

Browser fallback modes:

- `BACKSTOP_BROWSER_FALLBACK=1` uses Chromium only when static evidence is incomplete.
- `BACKSTOP_BROWSER_FALLBACK=force` always attempts Chromium rendering for local verification.
- `BACKSTOP_BROWSER_FALLBACK=0` forces static HTML scanning only.

Google Web Risk is optional. When no key is configured, Backstop reports that threat screening is unavailable rather than treating the URL as clean.

## Protection persistence

Protected purchases now use the Express API and a local PostgreSQL database. The browser keeps only an anonymous client UUID in `localStorage` so local records can be namespaced without implementing accounts yet.

On the first successful database load, Backstop automatically imports legacy protected purchases from the previous `localStorage` model and removes the old purchase payload only after the import succeeds.

The database stores:

- purchase and delivery dates
- calculated return, warranty and renewal deadlines
- detected protection terms
- lifecycle state
- saved scan-evidence snapshots
- merchant/product/value metadata

Deadline calculation is repeated server-side before persistence. The frontend still calculates previews for immediate UX, but PostgreSQL is the source of truth for saved records.

This client UUID is **not authentication** and is not a security boundary. Real accounts remain a later production step.

## Deadline reminders

Backstop generates reminders from persisted return, warranty and renewal deadlines when those deadlines enter the configured reminder window.

The default reminder window is 7 days and can be changed from the notification center to 3, 7, 14 or 30 days. Reminder records, read state and desktop-delivery state are stored in PostgreSQL.

The browser polls the notification API once per minute while Backstop is open. Desktop alerts use the browser Notification API and therefore require explicit browser permission. This local build does not yet use service workers or web push, so desktop alerts are not delivered while Backstop is completely closed.

Date or lifecycle changes invalidate stale unread reminders before new ones are generated.

## Main files

- `server/scanner.ts` - scan orchestration and scoring
- `server/db/pool.ts` - PostgreSQL connection pool
- `server/db/migrate.ts` - SQL migration runner
- `server/protectionRepository.ts` - PostgreSQL persistence layer
- `server/protectionRoutes.ts` - protection API
- `server/notificationRepository.ts` - reminder generation and notification persistence
- `server/notificationRoutes.ts` - notification API
- `server/browserFetch.ts` - restricted Chromium-rendered fallback
- `server/domainIntelligence.ts` - RDAP, DNS and TLS evidence
- `server/threatIntelligence.ts` - Google Web Risk adapter
- `server/companyIntelligence.ts` - merchant identity and GLEIF lookup
- `src/mappers/scanMapper.ts` - API-to-UI transformation
- `src/services/scanService.ts` - scanner client
- `src/services/protectionService.ts` - protection API client, UI hydration and legacy localStorage migration
- `src/services/backstopApi.ts` - shared browser API client and anonymous client identity
- `src/services/notificationService.ts` - reminder API client
- `src/mappers/notificationMapper.ts` - raw reminder data to UI copy/state
- `src/components/ProtectionDrawer.tsx` - protection setup
- `src/components/Dashboard.tsx` - saved purchase dashboard
- `src/components/ProtectedPurchaseDetail.tsx` - purchase timeline, evidence and lifecycle actions
- `src/components/NotificationCenter.tsx` - reminder bell, settings and notification feed
- `src/components/RiskMeter.tsx` - explainable risk breakdown

## Architecture notes

Backstop keeps API extraction values and UI presentation separate. Scanning and persistence logic live outside React components, while components consume mapped types and derived view data.

The Chromium fallback is conditional and restricted: public HTTP(S) network targets are checked, service workers and WebSockets are blocked, and image/media/font resources are skipped.

## Next logical build steps

1. Authentication and mapping the local client namespace to real user accounts
2. Service-worker/web-push delivery when Backstop is closed
3. Receipt and email ingestion
4. Dispute/refund workflow using saved evidence
5. Historical pricing data
6. Broader company-registry coverage
7. Browser extension
