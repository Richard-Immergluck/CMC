# CMC Release Gates

Use this checklist before promoting a Preview deployment to Production. Keep evidence in the PR, deployment notes, or release notes.

## Required Gates

- Development work has landed on `dev` first. Production promotion happens only through a reviewed release PR from `dev` to `master`.
- GitHub CI is green on the exact commit being promoted.
- `yarn sanity`, `yarn deps:audit`, `yarn deploy:check`, `yarn routes:check`, `yarn test:unit`, `yarn test:integration`, and `yarn test:e2e` have passed in CI.
- Push CI is green on `dev` before using it as the Preview integration branch.
- Vercel Preview is deployed from `dev` and points at the development database, not Production.
- If HITL login testing is required, the Preview deployment is assigned to the stable OAuth-safe alias:

```text
vercel alias set <random-preview-host> classical-music-catalogue-richardimmerglucks-projects.vercel.app
```

- Google OAuth has authorised callback URLs for the stable Preview alias and Production domain:

```text
https://classical-music-catalogue-richardimmerglucks-projects.vercel.app/api/auth/callback/google
https://classical-music-catalogue.vercel.app/api/auth/callback/google
```

- Preview smoke tests pass with:

```text
SMOKE_BASE_URL=https://classical-music-catalogue-richardimmerglucks-projects.vercel.app yarn smoke
```

- The `CMC Live Smoke` workflow passes against the stable Preview alias, either from its schedule or via `workflow_dispatch`.
- Preview shallow health check returns `status: "ok"`:

```text
curl -s https://classical-music-catalogue-richardimmerglucks-projects.vercel.app/api/health
HEALTH_SMOKE_BASE_URL=https://classical-music-catalogue-richardimmerglucks-projects.vercel.app yarn smoke:health
```

- Preview protected deep health has been checked from an authenticated support/admin session after infrastructure changes.
- Admin Security tab has been reviewed and a JSON or CSV security report has been exported for releases that touch auth, payments, admin access, audit events, or security dashboards.
- Production readiness passes with production-scoped platform values:

```text
VERCEL_ENV=production VERCEL_GIT_COMMIT_REF=master CMC_EXPECTED_PRODUCTION_BRANCH=master VERCEL_PROJECT_ROOT=. VERCEL_NODE_VERSION=24.x SUPABASE_PROJECT_STATUS=ACTIVE yarn deploy:check
```

- Production `NEXTAUTH_URL` is the final HTTPS production URL.
- Production `ALLOW_SIMULATED_PURCHASES` is unset or `false`.
- Production `CMC_ENABLE_SYNTHETIC_FIXTURES` is unset or `false`.
- Stripe webhook endpoint exists for the target deployment host and subscribes to `checkout.session.completed`.
- Supabase migrations have been applied to the intended database only after Preview verification.
- `yarn security:rls` passes against the target database after migrations.
- S3 credentials are environment-scoped and use the intended bucket/prefix.

## Post-Release Gates

- Production smoke tests pass:

```text
SMOKE_BASE_URL=https://<production-host> yarn smoke
```

- Production shallow health check returns `status: "ok"` at `https://<production-host>/api/health`.
- Vercel runtime logs show no new checkout, webhook, upload, or signed URL error spike.
- Stripe webhook deliveries for the production endpoint are succeeding.
- Supabase project health is active.
- If audit cleanup occurred, the exported security report, SQL/date range, row count, operator, and reason are recorded in release notes or incident notes.
- Any operational deviation is recorded in `OPERATIONS_RUNBOOKS.md` or release notes.

## Hard Stop Conditions

Do not promote if any of these are true:

- Preview is connected to the production database.
- Production is deployed from any branch other than `master`.
- Preview/dev is deployed from an unexpected branch when `CMC_EXPECTED_PREVIEW_BRANCH=dev` is configured.
- A random Vercel Preview deployment URL is shared for OAuth HITL testing instead of the stable preview alias.
- Production uses plain HTTP, localhost, or a Preview host for `NEXTAUTH_URL`.
- Simulated purchases or synthetic fixtures are enabled in Production.
- Smoke tests fail on security headers, auth gates, method contracts, or request-id headers.
- RLS/grant posture checks fail.
- Webhook signature verification is untested for the production endpoint.
- Audit cleanup is requested without a prior export and written retention rationale.
