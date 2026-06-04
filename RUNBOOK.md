# CMC Operational Runbook

This runbook captures the moving parts needed to operate the hardened CMC/Trax app.

## Project Locations

- GitHub: `Richard-Immergluck/CMC`
- App directory: `trax/`
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

1. Create or activate a Supabase development branch.
2. Apply Prisma migrations against that branch.
3. Run the Vercel preview deployment against the branch database.
4. Verify signup/login, upload, checkout, webhook fulfilment, profile download, and unauthorized denial.
5. Apply migrations to production only after the preview path is clean.

## CI Expectations

The GitHub workflow in `.github/workflows/trax-ci.yml` runs:

- `yarn install --frozen-lockfile`
- `yarn prisma generate`
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
