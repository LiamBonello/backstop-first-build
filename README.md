# Backstop - First Build

A polished front-end proof of concept for the Backstop consumer-purchase protection product.

## What is included

- High-tech responsive landing screen
- URL input with validation
- Animated multi-stage scan experience
- Evidence-backed result screen
- Expandable risk findings
- Purchase protection drawer
- Protection dashboard
- Strict TypeScript types
- API DTO -> UI mapping layer
- Mock service isolated from UI so a real backend can replace it later
- Material UI v9 using current stable APIs

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL, normally `http://localhost:5173`.

## Production build

```bash
npm run build
```

## Current demo behavior

The first build intentionally uses a mock response. Any valid URL runs the same demo analysis so the product flow can be evaluated before backend work begins.

The mock response lives here:

`src/mocks/scan.ts`

The mock API adapter lives here:

`src/services/scanService.ts`

The DTO-to-UI transformation lives here:

`src/mappers/scanMapper.ts`

When a backend exists, replace the implementation of `ScanService` without moving response transformation logic into the components.

## Main UI files

- `src/components/HeroScanner.tsx` - landing hero and scan box
- `src/components/ScanProgress.tsx` - animated analysis state
- `src/components/ScanResult.tsx` - analysis result
- `src/components/FindingCard.tsx` - expandable findings
- `src/components/ProtectionDrawer.tsx` - protect-purchase workflow
- `src/components/Dashboard.tsx` - protected purchases dashboard
- `src/theme.ts` - global MUI theme

## Next logical build steps

1. Real URL ingestion API
2. Merchant/domain intelligence
3. Terms, returns and subscription extraction
4. Authentication and persistence
5. Real protected-purchase data
6. Receipt/email ingestion
7. Browser extension
8. Evidence archive and dispute workflow

## Browser-rendered fallback

Backstop first scans public HTML directly. If core product evidence is missing or the page appears JavaScript-gated, the API conditionally renders the page in headless Chromium and re-runs the same extraction pipeline against the rendered DOM.

The fallback uses `playwright-chromium` and is enabled by default.

- `BACKSTOP_BROWSER_FALLBACK=1` uses Chromium only when the static scan is incomplete.
- `BACKSTOP_BROWSER_FALLBACK=force` always attempts Chromium rendering and is useful for local verification.
- `BACKSTOP_BROWSER_FALLBACK=0` disables browser rendering and forces static HTML scanning.

Network requests made by the fallback are restricted to public HTTP(S) hosts, service workers and WebSockets are blocked, and heavy image/media/font resources are skipped.
