# CMC Enterprise Hardening Lifecycle

This repo is starting from a working dissertation prototype. The product intent is strong: a classical backing-track marketplace where uploaders publish tracks, buyers preview and purchase them, and owners can download/comment on full tracks.

The hardening strategy is to preserve that product shape while moving authority to server-side code, replacing simulated commerce with verified payment events, and gradually separating infrastructure, domain logic, and UI.

The delivery breakdown for this work lives in `ENTERPRISE_ROADMAP.md`. Use that roadmap to plan sprint scope and PR sequencing; use this document for the architectural hardening principles and phase intent.

Track audio access, preview/full-download separation, purchase ownership, and signed URL controls are documented in `TRACK_ACCESS_SECURITY.md`.

## Target Architecture

```text
Repository root
  components/             React UI only
  pages/                  Next.js pages and API route adapters
  lib/
    server/               Server-only infrastructure and authorization
      prisma.js
      s3.js
      ownership.js
      stripe.js
    validation/           Shared input schemas
    formatting/           Display helpers
  services/               Testable domain workflows
    tracks.js
    purchases.js
    comments.js
    uploads.js
```

API handlers should be thin adapters. Business rules should live in services. Browser code should never access database, Stripe secret keys, AWS credentials, or direct purchase authority.

## Phase 0: Repo And Deployment Baseline

- Rotate any credentials that have ever appeared in source control.
- Keep all secrets in Vercel/Supabase/GitHub secret stores only.
- Document required environment variables in `.env.example`.
- Promote the app from `trax/` to the repository root.
- Remove unused binaries, generated artifacts, and experimental dependencies.
- Add CI for install, lint, build, and tests.

## Phase 1: Authority Boundaries

- Server-only S3 signing for uploads, previews, full playback, and downloads.
- Server-side authorization for owned tracks based on the current session.
- Explicit method/auth validation in every API route.
- Server-side input validation for all request bodies.
- Remove all client-side AWS SDK usage.

## Phase 2: Verified Commerce

- Replace simulated cart purchase with Stripe Checkout sessions.
- Create pending orders before redirecting to Stripe.
- Fulfil purchases only from verified Stripe webhooks.
- Add `Order`, `OrderItem`, and `PaymentEvent` models.
- Make ownership creation idempotent with unique constraints.

## Phase 3: Data Model Hardening

- Store money as integer minor units, e.g. `pricePence`, not `Float`.
- Generate formatted prices at display time.
- Add track status: `DRAFT`, `PROCESSING`, `PUBLISHED`, `ARCHIVED`.
- Add upload processing state and moderation fields.
- Add indexes for catalogue search and ownership lookups.

## Phase 4: Product Reliability

- Add unit tests for parsing, formatting, authorization, and services.
- Add API/integration tests against a disposable PostgreSQL database.
- Add Playwright tests for browse, upload, checkout, download, and authorization denial.
- Add Sentry or equivalent error tracking.
- Add structured logs and audit records for purchases/downloads/uploads.

## Phase 5: Enterprise Readiness

- Role-based access control: user, uploader, admin, support.
- Admin moderation and support console.
- Data retention/deletion workflows.
- Privacy/GDPR process documentation.
- Infrastructure as code for production/staging.
- Backup/restore drills and incident runbooks.
- Dedicated production/preview data separation with repeatable non-production seed data.

## Current Hardening Pass

This branch starts Phase 0 and Phase 1 by removing direct browser-side S3 authority, adding server-only signed URL generation, documenting required secrets, and tightening ownership checks around full playback/download URLs.

## Connected Platform Inventory

- GitHub repo: `Richard-Immergluck/CMC`
- Vercel team: `richardimmerglucks-projects`
- Vercel project: `classical-music-catalogue`
- Vercel project id: `prj_m8iuNH1ZouYKRXDjHqSBzzuTjcP5`
- Current Vercel framework: `nextjs`
- Current Vercel Node version observed before settings remediation: `14.x`
- Latest recorded Vercel production deployment: `ERROR`
- Supabase project: `CMBC Production`
- Supabase project id/ref: `qliszqosnphiuwhyzgsj`
- Supabase development project: `CMBC Development`
- Supabase development project id/ref: `vsbemyullcrinlrlxbhr`
- Supabase region: `eu-west-2`
- Supabase status observed during this pass: `ACTIVE_HEALTHY`
- Original Supabase project `CMBC` (`ekuxltipaucirgkwnpwy`) could not be restored after being paused for more than 90 days.

Immediate platform decisions:

- Move production runtime away from Node 14 because it is end-of-life.
- Target Node 24 LTS for the modernized application runtime.
- Use Supabase development branches before future production DDL; the replacement production project has had the current Prisma schema applied.
- Keep Prisma's `_prisma_migrations` ledger aligned with any emergency migrations applied through Supabase tooling.
- Keep simulated purchase fulfilment disabled in production.
- Deploy hardening branches as previews only until payment and storage flows are verified end to end.
- Treat Supabase RLS as the next release gate. Advisors currently flag all public tables as RLS-disabled, including token/session/account tables; enabling it needs explicit policies and a smoke test of Prisma, NextAuth, checkout, webhook fulfilment, and downloads.
- Treat Google and email magic-link as the musician-facing auth path; GitHub OAuth is not a production customer sign-in strategy.
