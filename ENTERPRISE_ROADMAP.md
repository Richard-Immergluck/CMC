# CMC Enterprise Delivery Roadmap

This roadmap translates the enterprise hardening intent into sprint-sized delivery work. It assumes CMC remains a Next.js marketplace for classical backing tracks where uploaders publish audio, customers preview and buy tracks, and verified owners can download and comment.

The target is not just a tidier prototype. The target is a robust, testable, secure product system with clear ownership boundaries, repeatable deployments, observable runtime behaviour, and a data model that can support real customers.

## Current Baseline

Completed foundations:

- Repository entrypoint is the Next.js app root.
- Node runtime is aligned to the current LTS line.
- GitHub CI runs install, Prisma generation, migrations, sanity checks, dependency audit, deployment readiness, lint, and build.
- Production, Preview, and Development infrastructure are separated across Vercel environment scopes.
- Production and Development Supabase projects are separate.
- Production and Development S3 credentials are separate, with environment key prefixes.
- Demo seed data runs against Development/Preview using real S3-backed fixtures.
- GitHub sign-in has been removed from the intended customer sign-in surface.
- Stripe Checkout and webhook-based ownership fulfilment exist.
- Server-side signed URLs are used for S3 upload, preview, full playback, and download.

Known gaps:

- API route handlers still contain too much business logic.
- Request validation is inconsistent and mostly hand-written.
- Test coverage is not yet deep enough for marketplace-critical flows.
- Supabase RLS posture needs to be turned from advisory remediation into a repeatable gate.
- User roles, uploader status, moderation, audit history, and support operations are not yet modelled.
- Observability, alerting, and incident response are still minimal.
- The UI is still closer to a prototype than an enterprise-grade operational/customer product.

## Enterprise Principles

Every PR should move the app toward these principles:

- Server-side authority: the browser never decides ownership, purchase fulfilment, storage keys, prices, or privileged actions.
- Thin adapters: API routes and pages adapt HTTP/UI concerns; services own workflows.
- Typed validation at boundaries: every external input is parsed before use.
- Least privilege: cloud keys, database roles, route permissions, and user actions have the smallest useful scope.
- Test the contract: services, API routes, migrations, and critical user journeys have automated checks.
- Environment parity: Development and Preview prove changes before Production receives them.
- Observable by default: important failures and business events are visible without digging through raw logs.
- Recoverable operations: migrations, backups, rollbacks, and incident steps are documented and practised.

## Delivery Cadence

Use one sprint as roughly one focused development tranche, not necessarily a calendar fortnight. Each sprint should produce small PRs that can be reviewed, deployed to Preview, smoke-tested, and merged independently.

Standing App Router checkpoint:

- At the start of every new development tranche, make a conscious yes/no decision on whether the Next.js App Router migration epic should begin at that point.
- Notify the project owner of the decision and the reason before proceeding with substantial implementation.
- Default to "no" while active security, commerce, database, smoke-test, or product-surface work would be made riskier by a routing migration.
- Switch to "yes" only when the current sprint benefits from route/layout restructuring, has enough Playwright coverage to protect behaviour, and can migrate one route family without weakening release confidence.

The route-family migration sequence is tracked in `APP_ROUTER_MIGRATION_PLAN.md`.

Default PR gates:

- Local checks pass.
- CI passes.
- Preview deployment succeeds.
- Preview smoke test passes.
- Any changed flow has either unit, integration, or end-to-end verification.
- Runbook or roadmap is updated when operational behaviour changes.

Production promotion gate:

- Preview has been tested against CMBC Development.
- No new Supabase advisor findings are introduced.
- Stripe webhook path is verified for payment-related changes.
- S3 signed URL and permission behaviour is verified for storage-related changes.
- Rollback path is known before release.

## Sprint 1: Server Boundary And Validation

Goal: make API routes predictable, testable, and safe enough to support deeper security work.

PR 1.1 - API foundation helpers

- Add server helpers for method enforcement, JSON responses, authenticated session lookup, typed errors, and consistent error mapping.
- Stop exposing provider access tokens in the NextAuth session unless a concrete server-side use case exists.
- Update a small, low-risk route to prove the pattern.

Acceptance:

- Existing auth smoke tests still pass.
- No provider access token is included in the session response by default.
- New helpers have unit coverage.

PR 1.2 - Validation layer

- Add shared validation schemas for IDs, pagination, currency, price, preview ranges, S3 upload metadata, checkout track IDs, and comment bodies.
- Prefer a single validation library and use it consistently at HTTP boundaries.
- Return stable 400 responses for invalid inputs.

Acceptance:

- Invalid request tests cover upload signing, track creation, checkout, signed URL access, and comments.
- No route reads unvalidated body fields for marketplace-critical actions.

PR 1.3 - Track and upload services

- Move track creation and upload key decisions into server services.
- Keep API routes as thin adapters.
- Enforce allowed content types, file extensions, key prefixing, preview bounds, and price conversion in services.

Acceptance:

- Unit tests cover track creation success/failure cases.
- Upload signing tests prove invalid file names and types are denied.
- Existing Preview S3 upload and sample playback checks still pass.

## Sprint 2: Commerce Integrity

Goal: make purchase authority robust, auditable, and regression-tested.

PR 2.1 - Purchase service hardening

- Refactor checkout creation into a purchase service.
- Validate track IDs before database reads.
- Exclude unpublished, archived, or invalid-price tracks from purchase.
- Preserve server-side price authority from database state.

Acceptance:

- Unit tests cover empty carts, duplicate tracks, already-owned tracks, unpublished tracks, invalid prices, and successful order creation.
- Checkout API route contains no business rules beyond adapting request/response.

PR 2.2 - Stripe webhook resilience

- Make webhook event processing idempotent and explicit for supported event types.
- Store enough event metadata for support and audit without depending on raw provider dashboards.
- Add structured error paths for unknown order, unpaid checkout, duplicate event, and fulfilment failure.

Acceptance:

- Tests cover duplicate webhook delivery and paid checkout fulfilment.
- Track ownership is created exactly once per paid order item.
- Failed or ignored events are recorded.

PR 2.3 - Order and ownership audit trail

- Add explicit audit records for checkout creation, payment event processing, ownership grant, and download URL issuance.
- Include actor, entity, action, timestamp, and non-sensitive metadata.

Acceptance:

- Audit records exist for successful checkout and fulfilment.
- Download/full playback requests can be correlated to user and track.

## Sprint 3: Database And RLS Hardening

Goal: make the Supabase posture enterprise-safe while preserving the Prisma server-side architecture.

PR 3.1 - RLS policy design document

- Document which tables are server-only, which are public-read, and which are user-owned.
- Decide whether browser Supabase access is intentionally unsupported.
- Define table grants for `anon`, `authenticated`, application connection users, and migration users.

Acceptance:

- RLS design is reviewed before SQL changes.
- Policy decisions are linked from the runbook.

PR 3.2 - RLS and grants migration

- Enable RLS for public tables.
- Revoke direct browser role table access where not required.
- Add policies only where there is a real browser-side access model.
- Verify Prisma server-side access still works.

Acceptance:

- Supabase advisors no longer flag public application tables as RLS-disabled.
- NextAuth login/session persistence works.
- Catalogue, checkout, webhook, ownership, and signed URL flows still pass in Preview.

PR 3.3 - Data model normalization

- Remove legacy money fields or clearly mark transition fields.
- Add role/uploader status fields.
- Add moderation and processing fields for tracks.
- Add indexes for catalogue filtering, ownership checks, and order support views.

Acceptance:

- Migration applies cleanly to Development.
- Backfill is idempotent.
- Production migration plan is documented before promotion.

## Sprint 4: Test Infrastructure

Goal: make confidence automatic rather than dependent on manual poking.

PR 4.1 - Unit test runner and service tests

- Add a test runner suitable for Node and React code.
- Add tests for validation, formatting, ownership, order, upload, and track services.

Acceptance:

- CI runs unit tests.
- Core services are tested without network dependencies.

PR 4.2 - Integration database tests

- Add disposable PostgreSQL test setup through Docker or a controlled test database.
- Run Prisma migrations before integration tests.
- Test API/service flows against a real database.

Acceptance:

- Integration tests cover user creation, track creation, order creation, webhook fulfilment, and ownership lookup.
- Tests can run locally from a documented command.

PR 4.3 - Playwright end-to-end suite

- Add browser tests for public catalogue browsing, auth surface, upload flow, checkout redirect path, profile ownership, download denial, and download success.
- Use dev seed data and test-mode Stripe where possible.

Acceptance:

- CI can run a smoke subset.
- Full E2E suite is documented for release verification.

## Sprint 5: Observability And Operations

Goal: make failures visible, diagnosable, and actionable.

PR 5.1 - Structured logging

- Add structured server logging with request IDs.
- Log key business events without secrets or personal data overexposure.
- Standardise error logging across API routes.

Acceptance:

- API failures include correlation IDs.
- Checkout, webhook, upload signing, and signed URL issuance have useful event logs.

PR 5.2 - Error tracking and performance monitoring

- Add Sentry or equivalent error tracking.
- Add Vercel Web Analytics and Speed Insights if appropriate.
- Document alert ownership and triage steps.

Acceptance:

- Preview and Production have separate projects/environments in the observability tool.
- A deliberate test error can be observed and traced in Preview.

PR 5.3 - Operational runbooks

- Add incident runbooks for failed checkout, failed webhook, S3 access denied, database migration failure, and accidental secret exposure.
- Add backup and restore drill documentation.

Acceptance:

- Each critical service has a named failure mode and recovery path.
- Secrets rotation steps are current for Vercel, Supabase, AWS, Stripe, and Google.

## Sprint 6: Product Roles And Admin Controls

Goal: support real marketplace operations, not just happy-path customers.

PR 6.1 - Roles and permissions

- Add roles for customer, uploader, admin, and support.
- Centralise permission checks in server code.
- Ensure role changes are auditable.

Acceptance:

- Non-admin users cannot access privileged APIs.
- Upload permissions can be controlled independently from customer purchasing.

PR 6.2 - Uploader workflow

- Add uploader onboarding/status.
- Support draft, processing, review, published, rejected, and archived track states.
- Restrict catalogue visibility to published tracks.

Acceptance:

- Uploaders can create drafts.
- Customers only see purchasable published tracks.
- Admin/support can see moderation-relevant state.

PR 6.3 - Admin/support console

- Add admin views for users, tracks, orders, payments, ownership, and audit events.
- Add safe support actions with explicit confirmation and audit logging.

Acceptance:

- Admin console works in Preview with seeded data.
- Support actions cannot modify records silently.

## Sprint 7: Frontend Product Rebuild

Goal: turn the UI from prototype pages into a coherent product experience.

PR 7.1 - Design system baseline

- Establish layout primitives, form controls, buttons, tables, alerts, empty states, and loading states.
- Remove ad hoc Bootstrap patterns where they fight consistency.

Acceptance:

- Core pages use shared UI primitives.
- Accessibility basics are covered for forms, buttons, navigation, and media controls.

PR 7.2 - Customer catalogue and purchase journey

- Rebuild catalogue browsing, track detail, cart, checkout return, and profile/library pages.
- Make preview playback, pricing, ownership, and download state clear.

Acceptance:

- Customer happy path passes Playwright.
- Unowned download/full playback denial is clear and tested.

PR 7.3 - Uploader experience

- Rebuild upload, metadata editing, preview range selection, publishing status, and track management.
- Add validation feedback that mirrors server rules.

Acceptance:

- Uploader happy path passes Playwright.
- Failed uploads and invalid metadata produce useful UI states.

## Sprint 8: Compliance, Privacy, And Enterprise Controls

Goal: prepare the app for institutional or commercial operation.

PR 8.1 - Privacy and data lifecycle

- Document data categories, retention expectations, deletion/export process, and lawful basis assumptions.
- Add account deletion/export workflows where required.

Acceptance:

- User data can be identified and exported.
- Deletion process is documented and tested in Development.

PR 8.2 - Security review and dependency governance

- Add dependency update policy.
- Add secret scanning expectations.
- Review CSP, secure headers, cookie settings, and webhook exposure.

Acceptance:

- Security headers are configured and tested.
- Dependency audit is documented with triage rules.

PR 8.3 - Infrastructure as code decision

- Decide whether to manage Vercel, Supabase, AWS, Stripe, and DNS through Terraform/Pulumi or documented console operations.
- If IaC is chosen, introduce it incrementally for non-production first.

Acceptance:

- Environment recreation path is documented.
- Production changes have reviewable infrastructure history.

## Current Post-Migration PR Queue

App Router checkpoint for this queue: no new migration epic is needed. Route-family migration is complete enough that the next value is guardrail hardening, smoke coverage, observability, and operational confidence.

Sprint A - Observability baseline:

1. `route-telemetry-foundation`
   - Add reusable route lifecycle telemetry with request IDs, durations, start/completion/failure events, and unit coverage.
   - Apply it first to upload signing and checkout session creation.
2. `critical-route-telemetry`
   - Extend the same pattern to Stripe webhook handling, checkout reconciliation, signed track URLs, track creation, comments, and admin mutations.

Sprint B - Health and diagnostics:

3. `health-endpoints`
   - Add a shallow public health endpoint for uptime checks.
   - Add a protected deep health endpoint for database, storage, Stripe configuration, and environment readiness.
4. `diagnostic-runbook`
   - Document how to use health checks and Vercel runtime logs during incidents and deployment verification.

Sprint C - Abuse guardrails:

5. `api-rate-guardrails`
   - Add a conservative per-instance rate-limit helper for high-risk routes.
   - Apply it to upload signing, checkout creation, comments, and signed URL issuance.
   - Document the enterprise upgrade path to managed Redis or WAF-level throttling.

Sprint D - Audit and support readiness:

6. `audit-enrichment`
   - Ensure upload, checkout, webhook, download, moderation, and support operations leave safe audit metadata.
   - Keep secrets, provider payloads, and excessive personal data out of audit rows.

Sprint E - Smoke and release automation:

7. `scheduled-smoke`
   - Add scheduled and manual GitHub Actions smoke checks against the stable dev alias.
   - Keep OAuth-safe HITL links and smoke URLs documented in release gates.

This order keeps visual/UI work deliberately out of scope until the core security and reliability guardrails are boringly solid.

## Definition Of Enterprise Grade For CMC

CMC can reasonably be called enterprise-grade when:

- Critical flows are covered by automated tests: sign-in, upload, browse, checkout, webhook fulfilment, ownership, preview, download, and denial.
- Production secrets are isolated, rotated, and absent from source control.
- Development, Preview, and Production use distinct database/storage/payment contexts.
- Database access is protected with RLS/grants and server-side authorization.
- Every API route validates input, enforces method/auth, and returns consistent errors.
- Payments and ownership are fulfilled only from verified provider events.
- Uploads and downloads are signed server-side with short-lived URLs.
- Business events are auditable.
- Runtime errors and critical business failures are observable.
- Migrations and releases are repeatable and reversible.
- Admin/support functions are role-restricted and audited.
- Data export/deletion and incident response processes are documented.
