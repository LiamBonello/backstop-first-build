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
- Local protected-purchase persistence
- Dynamic protection dashboard
- Protected-purchase detail view and event timeline
- Saved scan-evidence snapshots for newly protected purchases
- Editable protection dates with deadline recalculation
- Purchase lifecycle states: active, kept, returned and refunded

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL, normally `http://localhost:5173`.

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

Protected purchases are currently stored in browser `localStorage` through `src/services/protectionService.ts`.

The UI does not perform deadline arithmetic directly. The service stores raw purchase data and derives:

- return deadline
- warranty deadline
- next renewal date when the interval is known
- next upcoming deadline
- attention state
- dashboard metrics

The return calculation uses the delivery date when the user supplies one; otherwise it uses the purchase date. This is a calculation assumption, not a substitute for checking the merchant policy trigger.

Local storage is an MVP persistence layer. The service boundary is intended to make later migration to authenticated server persistence straightforward.

## Main files

- `server/scanner.ts` - scan orchestration and scoring
- `server/browserFetch.ts` - restricted Chromium-rendered fallback
- `server/domainIntelligence.ts` - RDAP, DNS and TLS evidence
- `server/threatIntelligence.ts` - Google Web Risk adapter
- `server/companyIntelligence.ts` - merchant identity and GLEIF lookup
- `src/mappers/scanMapper.ts` - API-to-UI transformation
- `src/services/scanService.ts` - scanner client
- `src/services/protectionService.ts` - protected-purchase persistence and deadline calculations
- `src/components/ProtectionDrawer.tsx` - protection setup
- `src/components/Dashboard.tsx` - saved purchase dashboard
- `src/components/ProtectedPurchaseDetail.tsx` - purchase timeline, evidence and lifecycle actions
- `src/components/RiskMeter.tsx` - explainable risk breakdown

## Architecture notes

Backstop keeps API extraction values and UI presentation separate. Scanning and persistence logic live outside React components, while components consume mapped types and derived view data.

The Chromium fallback is conditional and restricted: public HTTP(S) network targets are checked, service workers and WebSockets are blocked, and image/media/font resources are skipped.

## Next logical build steps

1. Authenticated persistence instead of device-only local storage
2. Notification scheduling for upcoming deadlines
3. Receipt and email ingestion
4. Dispute/refund workflow using saved evidence
5. Historical pricing data
6. Broader company-registry coverage
7. Browser extension
