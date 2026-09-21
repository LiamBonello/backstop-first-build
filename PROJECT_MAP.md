# Backstop project map

Backstop is an authenticated purchase intelligence MVP with four primary product states:

```text
Scan -> Protect -> Remind -> Resolve
```

## App shell

- `src/App.tsx`
  - Owns top-level view state.
  - Loads protected purchases, notifications and resolution cases.
  - Coordinates scanner, protection, reminders and resolution flows.
  - Shows the local-data bootstrap progress state.

- `src/components/TopNav.tsx`
  - Home navigation.
  - My protection entry.
  - Notification center.
  - Authenticated account entry and sign-out.

- `src/components/AccountDialog.tsx`
  - Account data export.
  - Permanent account deletion.

- `src/components/PrivacyDialog.tsx`
  - In-product privacy/data-use notice.

- `src/components/AppFooter.tsx`
  - Product boundary/disclaimer copy.

- `src/theme.ts`
  - MUI theme, typography, motion and visual defaults.

## Scan

- `src/components/HeroScanner.tsx` - URL capture and scan trigger.
- `src/components/ScanProgress.tsx` - live scan progress UI.
- `src/components/ScanResult.tsx` - scan summary and protection entry.
- `src/components/RiskMeter.tsx` - explainable heuristic score.
- `src/components/FindingCard.tsx` - evidence findings.
- `src/components/TransactionProfile.tsx` - signal profile.
- `src/components/DomainIntelligenceCard.tsx` - RDAP/DNS/TLS evidence.
- `src/components/ExternalIntelligenceCard.tsx` - Web Risk/company evidence.

## Protect

- `src/components/ProtectionDrawer.tsx` - purchase/delivery dates and deadline preview.
- `src/components/Dashboard.tsx` - protected purchases plus resolution cases.
- `src/components/ProtectedPurchaseDetail.tsx` - saved evidence, timeline, lifecycle and resolution entry.
- `src/services/protectionService.ts` - API client, hydration and legacy localStorage migration.
- `server/protectionRepository.ts` - PostgreSQL persistence.
- `server/protectionRoutes.ts` - protection API.

## Remind

- `src/components/NotificationCenter.tsx` - reminder feed/settings/read state.
- `src/mappers/notificationMapper.ts` - reminder presentation mapping.
- `src/services/notificationService.ts` - notification API client.
- `server/notificationRepository.ts` - due-reminder generation and persistence.
- `server/notificationRoutes.ts` - notification API.

## Resolve

- `src/components/ResolutionCaseDrawer.tsx` - case creation.
- `src/components/ResolutionCaseView.tsx` - case workspace, status, notes and merchant message.
- `src/mappers/resolutionMapper.ts` - labels, next-action guidance and deterministic message draft.
- `src/services/resolutionService.ts` - resolution API client.
- `server/resolutionRepository.ts` - resolution persistence and event history.
- `server/resolutionRoutes.ts` - resolution API.

## Shared data boundary

- `src/types/purchase.ts`
- `src/types/notification.ts`
- `src/types/resolution.ts`
- `src/services/authService.ts`
- `src/services/accountService.ts`
- `server/authMiddleware.ts`
- `server/accountRepository.ts`
- `server/accountRoutes.ts`
- `src/services/backstopApi.ts`

API data is mapped before UI components consume presentation fields. Components should not contain raw API-to-UI transformation logic.

## Database

- `server/db/pool.ts` - pg connection pool.
- `server/db/migrate.ts` - migration runner.
- `server/db/migrations/001_protected_purchases.sql`
- `server/db/migrations/002_deadline_notifications.sql`
- `server/db/migrations/003_resolution_cases.sql`

## Scanner backend

- `server/scanner.ts`
- `server/fetchHtml.ts`
- `server/browserFetch.ts`
- `server/urlSafety.ts`
- `server/domainIntelligence.ts`
- `server/threatIntelligence.ts`
- `server/companyIntelligence.ts`

## Authentication boundary

Public scans remain available before sign-in. Protected purchases, reminders and resolution cases are account-scoped using Neon Auth JWTs verified by Express against Neon's JWKS. The authenticated Neon user UUID is the repository ownership key.

Hosted deployment and authentication are now part of the MVP. Background web push, broader account-management surfaces and production operations remain separate productization workstreams.
