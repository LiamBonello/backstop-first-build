# Backstop project map

This file is here so future changes in chat can be given as exact file-by-file edits.

## App shell

- `src/App.tsx`
  - Controls the current prototype view: home, scan result, dashboard.
  - Owns prototype-level scan/protection state.

- `src/main.tsx`
  - React entry point.
  - Installs the MUI theme and global CSS baseline.

- `src/theme.ts`
  - Typography, colors, border radius and global motion/accessibility defaults.

## Home / scan flow

- `src/components/HeroScanner.tsx`
  - Hero copy, URL field, URL validation, demo trigger.

- `src/components/ScanProgress.tsx`
  - Animated multi-stage scan state.

- `src/components/SignalSection.tsx`
  - The three product pillars below the hero.

## Result flow

- `src/components/ScanResult.tsx`
  - Main result screen, risk meter and action buttons.

- `src/components/FindingCard.tsx`
  - Expand/collapse evidence finding cards.
  - Child controls stop propagation correctly.

- `src/components/ProtectionDrawer.tsx`
  - Return/warranty/renewal protection preview and confirmation.

## Dashboard

- `src/components/Dashboard.tsx`
  - Protected-purchase overview and metric cards.

- `src/mocks/dashboard.ts`
  - Demo dashboard business data. Keep demo/API values out of UI components.

## Data boundary

- `src/types/purchase.ts`
  - API DTO and UI types.

- `src/services/scanService.ts`
  - `ScanService` interface and current mock implementation.
  - Replace this implementation when the real backend exists.

- `src/mocks/scan.ts`
  - Mock API response for the first build.

- `src/mappers/scanMapper.ts`
  - Transforms API-shaped data into UI-shaped data.
  - Keep future transformation logic here rather than in components.

## Visual system

- `src/components/AmbientBackground.tsx`
  - Animated aurora/grid environment.

- `src/components/CursorGlow.tsx`
  - Pointer-reactive ambient light.

- `src/components/BrandMark.tsx`
  - Current CSS-generated Backstop icon.

- `src/components/TopNav.tsx`
  - Header navigation.

## Suggested edit format for future chat changes

When changing the project, edits can be communicated as:

1. **Replace this block** in `src/path/File.tsx` with a supplied block.
2. **Add this file** at `src/path/NewFile.tsx`.
3. **Delete this block/file** when obsolete.
4. Run `npm run build` after structural changes.

That keeps each chat update deterministic and easy to apply in VS Code.
