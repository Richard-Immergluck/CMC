# CMC Operational Runbook

This runbook captures the moving parts needed to operate the hardened CMC app.

## Project Locations

- GitHub: `Richard-Immergluck/CMC`
- App directory: repository root
- Vercel project: `classical-music-catalogue`
- Supabase project: `CMBC` (`ekuxltipaucirgkwnpwy`)
- Region target: `eu-west-2`

## Required Vercel Environment Variables

Configure these for Preview and Production. Production values must come from the relevant provider consoles, not from source control.

```text
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GITHUB_ID
GITHUB_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
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

Observed platform state on 2026-06-05:

- Latest production deployment failed before app build because Vercel was still using Node.js `14.x`.
- The app previously lived in `trax/`; it has now been promoted to the repository root so Vercel's entrypoint `.` is correct.

Set these before deploying:

- Root Directory: repository root / `.`
- Framework Preset: `Next.js`
- Node.js Version: `18.x`
- Install Command: default, or `yarn install --frozen-lockfile`
- Build Command: default, or `yarn build`

The app remains pinned to Node 18 until the dependency upgrade phase validates Next.js, NextAuth, Prisma, and Stripe on Node 20+. A deployment check is available locally:

```text
VERCEL_PROJECT_ROOT=. VERCEL_NODE_VERSION=18.x SUPABASE_PROJECT_STATUS=ACTIVE yarn deploy:check
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

## Supabase

Before deploying migrations to production:

1. Confirm the Supabase project is active.
2. Create or activate a Supabase development branch.
3. Apply Prisma migrations against that branch.
4. Run the Vercel preview deployment against the branch database.
5. Verify signup/login, upload, checkout, webhook fulfilment, profile download, and unauthorized denial.
6. Apply migrations to production only after the preview path is clean.

The current production Supabase project is `CMBC` (`ekuxltipaucirgkwnpwy`). If the Supabase connector reports that the project is inactive or requires reauthentication, migrations cannot be verified through automation yet.

Observed platform state on 2026-06-05: the Supabase connector required reauthentication, and earlier checks reported the project as inactive.

## CI Expectations

The GitHub workflow in `.github/workflows/cmc-ci.yml` runs:

- `yarn install --frozen-lockfile`
- `yarn prisma generate`
- `yarn prisma migrate deploy`
- `yarn sanity`
- `yarn deps:audit`
- `yarn deploy:check`
- `yarn lint`
- `yarn build`

The app currently uses legacy Next.js 12-era dependencies. CI is expected to surface dependency and lint debt that should be paid down in follow-up hardening PRs.

The current runtime target is Node 18 because the installed NextAuth version rejects Node 20. Move to Node 20+ only as part of a dependency upgrade PR.

## Release Checklist

- PR reviewed and CI green.
- Vercel Preview manually smoke-tested.
- Supabase migrations applied to the intended database.
- Stripe webhook endpoint configured for the deployment URL.
- AWS credentials rotated and scoped to least privilege.
- Production deployment monitored for checkout and webhook errors.
