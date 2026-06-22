# CMC Operational Runbook

This runbook captures the moving parts needed to operate the hardened CMC app.

## Project Locations

- GitHub: `Richard-Immergluck/CMC`
- App directory: repository root
- Vercel project: `classical-music-catalogue`
- Supabase project: `CMBC Production` (`qliszqosnphiuwhyzgsj`)
- Supabase development project: `CMBC Development` (`vsbemyullcrinlrlxbhr`)
- Region target: `eu-west-2`

## Required Vercel Environment Variables

Configure these for Preview and Production. Production values must come from the relevant provider consoles, not from source control.

```text
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
EMAIL_SERVER
EMAIL_FROM
S3_ACCESS_ID
S3_APP_ACCESS_KEY
S3_BUCKET_NAME
S3_REGION
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ALLOW_SIMULATED_PURCHASES=false
```

## Vercel Project Settings

The live Vercel project is `classical-music-catalogue`.

Observed platform state on 2026-06-11:

- Latest production deployment failed before app build because Vercel was still using Node.js `14.x`.
- The app previously lived in `trax/`; it has now been promoted to the repository root so Vercel's entrypoint `.` is correct.
- The Vercel connector did not expose a direct deploy/settings mutation path. Deployments should be triggered by Git integration or the Vercel CLI after the project settings and environment variables below are updated.

Set these before deploying:

- Root Directory: repository root / `.`
- Framework Preset: `Next.js`
- Node.js Version: `24.x`
- Install Command: default, or `yarn install --frozen-lockfile`
- Build Command: default, or `yarn build`

The app is pinned to the current LTS runtime line, Node 24. A deployment check is available locally:

```text
VERCEL_PROJECT_ROOT=. VERCEL_NODE_VERSION=24.x SUPABASE_PROJECT_STATUS=ACTIVE yarn deploy:check
```

## Stripe

Create a webhook endpoint for each deployed environment:

```text
https://<deployment-host>/api/stripe/webhook
```

Subscribe at minimum to:

```text
checkout.session.completed
```

The webhook secret must be stored as `STRIPE_WEBHOOK_SECRET`. Ownership grants happen only from verified webhook events.

## Authentication

Production authentication is aimed at non-technical musicians and customers:

- Google OAuth is the default social provider.
- Email magic-link sign-in is available when `EMAIL_SERVER` and `EMAIL_FROM` are configured.
- GitHub OAuth is intentionally not part of the production sign-in surface.

Configure OAuth callback URLs against each deployed environment before enabling a provider for that environment.

Use environment-scoped values for `NEXTAUTH_URL`. Production should point at the production domain. Preview deployments should either omit it or set it to the preview host; checkout return URLs deliberately use the request host outside production so test purchases stay inside the preview deployment.

## Supabase

Before deploying migrations to production:

1. Confirm the Supabase project is active.
2. Apply Prisma migrations against `CMBC Development`.
3. Run the Vercel preview deployment against the development database.
4. Run smoke tests against the Vercel preview URL.
5. Verify signup/login, upload, checkout, webhook fulfilment, profile download, and unauthorized denial.
6. Apply migrations to production only after the preview path is clean.

The original Supabase project `CMBC` (`ekuxltipaucirgkwnpwy`) was paused for more than 90 days and could not be restored. It has been replaced by `CMBC Production` (`qliszqosnphiuwhyzgsj`).

Current Supabase production details:

- Project ref: `qliszqosnphiuwhyzgsj`
- Project URL: `https://qliszqosnphiuwhyzgsj.supabase.co`
- Database host: `db.qliszqosnphiuwhyzgsj.supabase.co`
- PostgreSQL: `17`
- Status observed on 2026-06-11: `ACTIVE_HEALTHY`

Applied Supabase migrations on 2026-06-11:

- `initial_auth_tables`
- `add_track_catalogue_tables`
- `track_owner_unique_constraint`
- `add_orders_and_payment_events`
- `harden_track_money_and_status`
- `add_foreign_key_indexes`
- `baseline_prisma_migration_history`

The production database has also been baselined with Prisma's `_prisma_migrations` ledger for the matching source-controlled migration folders. This prevents future `prisma migrate deploy` runs from trying to replay migrations that were already applied through the Supabase migration API during recovery.

Security gate before production traffic: Supabase advisors report Row Level Security disabled for public tables. Because this app currently uses Prisma server-side rather than browser-side Supabase clients, RLS should be enabled with no browser-side table policies and with direct table grants revoked from Supabase `anon` and `authenticated` roles. Do not expose the Supabase anon key to the browser unless explicit, least-privilege policies have been designed and tested.

## Environment Separation

Production traffic runs from Vercel production deployments and the `CMBC Production` Supabase project. Development and preview verification should use one of:

- Vercel preview deployments against `CMBC Development`.
- Vercel preview deployments against a Supabase development branch.
- A separate Supabase development project if branch cost or lifecycle is undesirable.
- Local Docker PostgreSQL for fast application checks.

Supabase quoted development branch cost on 2026-06-12: `0.01344` hourly. Create branches deliberately and delete them when they are no longer needed.

Current development Supabase details:

- Project ref: `vsbemyullcrinlrlxbhr`
- Project URL: `https://vsbemyullcrinlrlxbhr.supabase.co`
- Database host: `db.vsbemyullcrinlrlxbhr.supabase.co`
- PostgreSQL: `17`
- Status observed on 2026-06-12: `ACTIVE_HEALTHY`
- Monthly project cost quoted by Supabase on 2026-06-12: `0`

The development schema has been aligned with production migrations and RLS posture. Vercel Preview should use this project through Preview-scoped `DATABASE_URL` once the development database password has been set/retrieved from Supabase.

## Seed Data

Use seed data only against development or preview environments unless production seeding is explicitly intended.

```text
yarn seed:demo
```

The seed script creates synthetic CC0 demo audio fixtures, uploads them to the configured S3 bucket, and creates catalogue rows for a demo uploader. It is intended for smoke tests, not production catalogue content.

If S3 credentials are unavailable or quarantined in Preview, set `CMC_ENABLE_SYNTHETIC_FIXTURES=true` only for Preview/Development. Seeded `demo-fixtures/*` tracks will then stream generated CC0 WAV fixtures from the app instead of S3. Leave this disabled in Production.

## Smoke Tests

Run deployment smoke tests against Preview before promotion and against Production after release:

```text
SMOKE_BASE_URL=https://<deployment-host> yarn smoke
```

The smoke test checks the home page, catalogue page, and public sign-in page. It also guards that GitHub sign-in is not exposed in the musician/customer auth surface.

## CI Expectations

The GitHub workflow in `.github/workflows/cmc-ci.yml` runs:

- `yarn install --frozen-lockfile`
- `yarn prisma generate`
- `yarn prisma migrate deploy`
- `yarn sanity`
- `yarn deps:audit`
- `yarn deploy:check`
- `node --check scripts/smoke-test.js`
- `yarn lint`
- `yarn build`

The app targets Node 24 LTS with a modernized Next.js, React, Prisma, Stripe, and ESLint toolchain. CI is expected to surface dependency and lint debt that should be paid down in follow-up hardening PRs.

## Release Checklist

- PR reviewed and CI green.
- Vercel Preview smoke-tested with `SMOKE_BASE_URL=https://<preview-host> yarn smoke`.
- Supabase migrations applied to the intended database.
- Stripe webhook endpoint configured for the deployment URL.
- AWS credentials rotated and scoped to least privilege.
- Production deployment monitored for checkout and webhook errors.
