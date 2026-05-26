# Poupi Frontend Stabilization

Last verified: 2026-05-26.

## Current State

- This local folder has no detected `.git` directory.
- The workspace is a pnpm/turbo monorepo.
- Apps live under `apps/*`.
- Shared packages live under `packages/*`.
- Real `.env.local` files exist locally and must not be committed.
- Safe examples now exist as `.env.example` and per-app `.env.local.example` files.

## Production Guardrail

Run:

```bash
pnpm check:prod-env
```

The check must pass before any production deploy.

Current status:

- Git baseline exists locally on branch `main`.
- Baseline commit: `92b2d56 chore: establish frontend baseline`.
- `npm run check:prod-env` passes.
- `npx --yes pnpm@9.15.0 check:prod-env` passes.
- `npx --yes pnpm@9.15.0 typecheck` passes for the monorepo.
- `npx --yes pnpm@9.15.0 lint` passes for the monorepo with warnings only in `apps/poupi-baby`.
- `npx --yes pnpm@9.15.0 build` passes for the monorepo.
- GitHub Actions CI is green on `main`.
- Green run: `26451821825`.
- `npx tsc --noEmit` passes in `apps/poupi-baby`.
- `npx eslint .` in `apps/poupi-baby` has 0 errors and remaining warnings only.
- Local development fallback is centralized in:
  - `apps/poupi-baby/src/lib/backend-url.ts`;
  - `apps/poupi-baby/src/services/api.ts`;
  - `packages/api-client/src/index.ts`.
- Production throws when required URL env vars are missing.

## Target Rules

- Production builds must never silently fallback to localhost.
- `NEXT_PUBLIC_*` variables are browser-visible and cannot contain secrets.
- `BACKEND_URL` is server-side only and should point to an internal service URL in production.
- Localhost defaults are allowed only for explicit local development.
- Deployments should inject env vars through CI/Coolify secrets.

## Required Variables

```env
NEXT_PUBLIC_API_URL=https://api.example.com
BACKEND_URL=http://data-core:8000
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
```

## Safe Migration Sequence

1. Configure branch protection for `main`.
2. Connect Coolify/deploy flow to GitHub.
3. Deploy from CI/Coolify, not from notebook-only state.

## Do Not Do

- Do not commit real `.env.local` files.
- Do not expose `BACKEND_URL` as `NEXT_PUBLIC_BACKEND_URL`.
- Do not remove local env files until deployment env vars are validated.
- Do not deploy production from this unversioned local folder.
