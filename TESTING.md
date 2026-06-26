# Testing Strategy

This project should treat manual HITL testing as acceptance evidence, not as the
only regression control. The automated suite is layered so fast checks catch
logic errors, route checks catch deployment-shape regressions, and browser tests
cover full user journeys.

## Current Automated Gates

- `yarn test:unit` runs Node test suites for validation, permissions, order
  pricing, checkout reconciliation, webhook handling, upload helpers, and admin
  serialization.
- `yarn test:integration` runs database-backed purchase/ownership/audit checks
  when `CMC_RUN_INTEGRATION_TESTS=true`.
- `yarn lint` enforces Next/React and code quality rules.
- `yarn build` verifies the production Next.js build.
- `yarn routes:check` verifies critical built routes exist in the Next route
  manifest after `yarn build`.
- `yarn test:e2e` runs Playwright smoke tests against the built app. CI starts a
  disposable Postgres service, applies Prisma migrations, builds the app, and
  verifies public navigation, unauthenticated API denial contracts, seeded
  authenticated ownership checks, purchased-track profile flows, owned-track
  commenting, and admin review approval.
- `yarn sanity`, `yarn deps:audit`, `yarn security:rls`, and
  `yarn deploy:check` cover structural, dependency, RLS/grant, and deployment
  readiness checks.

## Automated HITL Journeys

These formerly manual flows now have automated Playwright coverage:

1. Admin sign-in reaches the operations console.
2. Catalogue loads, track detail opens, and the Back action returns cleanly.
3. Admin Track Review can listen to a pending track and approve it.
4. Approved tracks appear in the public catalogue.
5. Purchased tracks appear in the profile Purchased tab and can be opened for
   playback, download, and commenting.
6. Logged-out users cannot access admin, upload signing, checkout, or protected
    full-track URLs.

## HITL Journeys To Automate Next

These flows still need deeper browser-level automation:

1. Authenticated upload rejects invalid submissions and accepts a valid MP3.
2. Upload completion modal offers Upload Another, Catalogue, and Review
   Submissions.
3. Customer checkout creates an order and returns to profile.
4. Checkout reconciliation grants ownership only after Stripe confirms payment.

## Browser E2E Plan

Playwright is installed and wired into CI. To run the smoke suite locally, use
the same disposable database pattern as CI:

```bash
yarn db:local:up
yarn db:local:migrate
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma?schema=public" yarn seed:e2e
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma?schema=public" yarn build
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma?schema=public" yarn test:e2e
```

Use `yarn seed:e2e` before the build when you need deterministic local data. The
seed creates local-only `e2e-*@example.com` users and a customer-owned catalogue
track for authenticated smoke tests.

The `/api/e2e/session` helper is guarded by `CMC_ENABLE_E2E_AUTH=true`,
`VERCEL_ENV !== "production"`, and a localhost/127.0.0.1 `NEXTAUTH_URL`. It
exists only to mint realistic NextAuth JWT sessions for Playwright and must not
be enabled in deployed production environments.

Use deterministic demo data and synthetic audio fixtures. Avoid real external
payment calls in E2E; use a mocked Stripe adapter or a test-only reconciliation
fixture that still exercises the server-side ownership path.

## Enterprise Direction

- Keep payment ownership rules unit-tested in pure services.
- Keep route existence checks post-build.
- Add API-level tests for admin, upload, checkout, profile, and signed URL
  contracts.
- Add Playwright smoke coverage before large UI refactors.
- Keep HITL as release acceptance for UX and audio/payment edge cases.
