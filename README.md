# Backstop

Backstop is a local-first consumer purchase intelligence web app. It inspects a public shopping URL before purchase, preserves the evidence that mattered at the time of purchase, tracks return/warranty/renewal deadlines, reminds the user before those deadlines, and provides a structured resolution case when something goes wrong.

## MVP product loop

1. **Scan** a public product/store URL.
2. **Understand** merchant, pricing, return, commitment, payment, domain and threat signals.
3. **Protect** the purchase with purchase/delivery dates.
4. **Preserve** the scan evidence that existed when protection started.
5. **Track** return, warranty and renewal deadlines in PostgreSQL.
6. **Remind** the user when a deadline enters the configured reminder window.
7. **Resolve** purchase problems in a PostgreSQL-backed case workspace with status history, notes and a factual merchant-message draft.

## Current capabilities

### Purchase intelligence

- React + TypeScript + Material UI interface
- Express scanner API
- Static HTML extraction with conditional Playwright Chromium rendering
- Product and price extraction
- Return, warranty and recurring-commitment analysis
- Payment-method detection
- RDAP domain-registration intelligence
- DNS and TLS checks
- Optional Google Web Risk threat screening
- Merchant legal-entity extraction
- Free GLEIF LEI lookup
- Evidence coverage reporting
- Explainable heuristic risk scoring

### Protection

- Purchase and delivery date capture
- Server-side deadline calculation
- PostgreSQL-protected purchases
- Return, warranty and renewal deadline tracking
- Purchase lifecycle states: active, kept, returned, refunded
- Saved evidence snapshots
- Protected-purchase timeline and detail workspace
- Editable dates with deterministic deadline recalculation
- Legacy localStorage purchase migration

### Reminders

- PostgreSQL-backed reminder records
- Configurable 3, 7, 14 or 30-day reminder windows
- In-app notification center
- Read/unread state
- Optional browser desktop notifications while Backstop is open
- Stale reminder cleanup after date/lifecycle changes
- Deduplication by purchase, deadline type and deadline date

### Resolution cases

- One resolution case per protected purchase
- Issue categories including refused return, overdue refund, non-response, unexpected renewal, warranty problem and item-not-as-described
- Amount-in-dispute and desired-outcome capture
- Case statuses from draft through resolved/closed
- Persisted case notes and status history
- Recommended next-action guidance
- Factual merchant-message draft generated from saved case facts
- Direct link back to the originating protected purchase and its evidence

## Local-first MVP boundary

Backstop currently uses an anonymous browser UUID to namespace records in the local database. This is **not authentication** and is not a security boundary.

The UI intentionally identifies this as **Local mode**. The MVP does not pretend accounts exist.

Desktop notifications use the browser Notification API and therefore require Backstop to be open. Background push while the app is completely closed would require a service worker, push subscription infrastructure and a hosted deployment.

Backstop is an evidence and workflow tool. It does not guarantee merchant legitimacy, policy enforceability, refunds, chargebacks or legal outcomes.

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

Start the app:

```bash
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

The default database URL is:

```text
postgresql://backstop:backstop@127.0.0.1:55432/backstop
```

## Verify the build

```bash
npm run typecheck
npm run build
```

## Environment

Create a project-root `.env` file when needed.

```env
DATABASE_URL=postgresql://backstop:backstop@127.0.0.1:55432/backstop
GOOGLE_WEB_RISK_API_KEY=
BACKSTOP_BROWSER_FALLBACK=1
```

Browser fallback modes:

- `BACKSTOP_BROWSER_FALLBACK=1`: use Chromium only when static evidence is incomplete.
- `BACKSTOP_BROWSER_FALLBACK=force`: always attempt Chromium rendering for local verification.
- `BACKSTOP_BROWSER_FALLBACK=0`: static HTML only.

Google Web Risk is optional. When no key is configured, Backstop reports threat screening as unavailable rather than treating the URL as clean.

## PostgreSQL migrations

- `001_protected_purchases.sql` - protected purchases, deadlines and saved evidence
- `002_deadline_notifications.sql` - reminder preferences and notification state
- `003_resolution_cases.sql` - resolution cases and persisted case history

## Main architecture

### Server

- `server/scanner.ts` - scan orchestration and scoring
- `server/fetchHtml.ts` - restricted static HTML fetch
- `server/browserFetch.ts` - restricted Chromium fallback
- `server/urlSafety.ts` - public-network target checks
- `server/domainIntelligence.ts` - RDAP, DNS and TLS evidence
- `server/threatIntelligence.ts` - Google Web Risk adapter
- `server/companyIntelligence.ts` - merchant identity and GLEIF lookup
- `server/protectionRepository.ts` / `server/protectionRoutes.ts` - protected purchase persistence/API
- `server/notificationRepository.ts` / `server/notificationRoutes.ts` - reminder generation/persistence/API
- `server/resolutionRepository.ts` / `server/resolutionRoutes.ts` - resolution case persistence/API
- `server/db/migrate.ts` - transactional SQL migration runner

### Client

- `src/App.tsx` - top-level product flow and local data orchestration
- `src/services/backstopApi.ts` - shared API client and anonymous local client identity
- `src/services/scanService.ts` - scanner client
- `src/services/protectionService.ts` - protection client/hydration/legacy migration
- `src/services/notificationService.ts` - reminder client
- `src/services/resolutionService.ts` - resolution case client
- `src/mappers/scanMapper.ts` - scanner API to UI mapping
- `src/mappers/notificationMapper.ts` - notification API to UI mapping
- `src/mappers/resolutionMapper.ts` - resolution case API to UI mapping and deterministic case copy
- `src/components/Dashboard.tsx` - purchase and case overview
- `src/components/ProtectedPurchaseDetail.tsx` - evidence/deadline/lifecycle workspace
- `src/components/NotificationCenter.tsx` - reminder center
- `src/components/ResolutionCaseView.tsx` - resolution workspace

## Production work intentionally outside this MVP

These are deployment/productization layers, not missing local MVP screens:

1. Real user accounts and authorization
2. Hosted PostgreSQL and deployment environment
3. Service-worker/web-push delivery while the app is closed
4. Email/receipt ingestion
5. Historical price datasets
6. Jurisdiction-specific consumer-rights/legal escalation logic
7. Browser extension
