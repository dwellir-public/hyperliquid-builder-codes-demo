# Turbopack-Only Migration Design (Next.js 16)

## Goal
Move the project to a strict Next.js 16 Turbopack setup so local and CI behavior matches framework defaults and no webpack-specific fallback path remains.

## Current State
- `package.json` currently pins `dev` and `build` to `--webpack`.
- `next.config.mjs` contains both `turbopack: {}` and a legacy `webpack()` block.
- CI now smoke-tests `npm run dev`, but scripts currently force webpack.

## Chosen Approach
1. Remove the `webpack()` section from `next.config.mjs`.
2. Restore script defaults to `next dev` and `next build`.
3. Keep CI dev smoke test and build test so Turbopack startup/build are exercised on every PR.

## Alternatives Considered
- Keep webpack fallback scripts: rejected to avoid mixed-mode drift.
- Partial migration of webpack config into turbopack alias rules: rejected for now because there is no current evidence those overrides are still required.

## Risks
- If some dependency relied on webpack-only fallback behavior (`fs/net/tls` fallbacks, externals, alias), Turbopack builds could fail.

## Mitigations
- Verify `bun run dev` startup after changes.
- Verify `npm run build` with CI-equivalent env.
- CI smoke step prevents regressions for dev startup mismatches.

## Success Criteria
- `dev` runs with Next 16 in Turbopack mode.
- `build` passes in Turbopack mode.
- CI runs both startup smoke and production build via Turbopack-path scripts.
