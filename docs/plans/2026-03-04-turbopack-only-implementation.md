# Turbopack-Only Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert runtime and CI to Turbopack-only behavior on Next.js 16.

**Architecture:** Remove webpack-specific config and stop forcing webpack scripts. Keep CI startup smoke and production build so Turbopack paths are continuously verified.

**Tech Stack:** Next.js 16, React 19, npm/bun scripts, GitHub Actions.

---

### Task 1: Remove legacy webpack bundler path

**Files:**
- Modify: `package.json`
- Modify: `next.config.mjs`

**Step 1: Update scripts to default Next.js 16 behavior**
Set `dev` to `next dev` and `build` to `next build`.

**Step 2: Remove webpack config block**
Delete `webpack: (config) => { ... }` from `next.config.mjs`, keeping `turbopack: {}` and `headers()`.

**Step 3: Run dev startup smoke locally**
Run: `timeout 15s bun run dev`
Expected: startup log shows `Next.js 16.x (Turbopack)` and exits via timeout code `124`.

**Step 4: Run production build locally**
Run: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=ci_placeholder npm run build`
Expected: build succeeds with Turbopack.

**Step 5: Commit migration**
```bash
git add package.json next.config.mjs
git commit -m "refactor: migrate project runtime to turbopack-only"
```

### Task 2: Keep CI aligned with Turbopack runtime

**Files:**
- Verify: `.github/workflows/ci.yml`

**Step 1: Ensure CI runs dev smoke through scripts**
No script hardcoding in CI; smoke runs `npm run dev` and build runs `npm run build`.

**Step 2: Run quick local sanity for workflow assumptions**
Run the same timeout command used by CI and confirm `124` timeout behavior.

**Step 3: Commit if workflow changed**
```bash
git add .github/workflows/ci.yml
git commit -m "ci: verify turbopack dev startup and build"
```
