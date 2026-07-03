# Security Hardening Tracker

This tracker records backend security and auditability work completed so far and the next target areas. Keep it current when opening hardening PRs.

## Completed

- Standardized Next.js App Router project structure and removed the legacy `pages/` route tree.
- Added CI coverage for unit tests, integration tests, RLS/grant posture, build, route manifest checks, Playwright browser smoke, dependency audit, and GitGuardian.
- Added live Vercel health and smoke workflows with bounded runtime.
- Added public and admin health endpoints, with admin health authentication.
- Added structured route telemetry with request IDs and downgraded expected 4xx failures to warning-level logs.
- Sanitized incoming request IDs before reflecting them in response headers and logs.
- Added same-origin protection for authenticated browser mutation routes.
- Added transactional audit events for checkout creation, ownership grants, rate-limit events, signed track access, admin user changes, admin moderation changes, track submissions, and profile comments.
- Blocked suspended and closed accounts at the authenticated API boundary.
- Blocked suspended and closed existing accounts during sign-in.
- Sanitized user-derived signed download filenames before S3 `Content-Disposition` generation.
- Normalized signed URL audit metadata across review, full, and download modes without storing signed URLs.
- Added explicit admin/support/customer authorization invariant tests.
- Added audit events for inactive-account sign-in denials without storing provider payloads.
- Strengthened RLS/grant posture checks to cover unexpected public tables and public sequence grants.
- Scoped new S3 upload object keys by authenticated user and centralized signed URL expiry policy.
- Added security observability triage, alert thresholds, and audit investigation runbook guidance.
- Added bounded admin operations audit filters for support investigations.
- Blocked and audited admin attempts to update their own access fields.
- Added optional Upstash Redis shared rate limiting with local fallback and Vercel Firewall starter guidance.
- Added durable second-review workflow for high-risk admin/support access changes.
- Added security alert threshold script and runbook guidance for recent audit events.
- Added admin console controls for reviewing pending access-change requests.
- Added production security dashboard guidance for durable in-app audit data.
- Added optional email notifications for pending privileged access-change reviews.
- Added access-review metrics for pending, overdue, latency, and recurring target analysis.
- Added admin notification badges for pending/overdue privileged access reviews.
- Added exportable JSON/CSV security reports for periodic review without paid log tooling.
- Added durable audit events for Stripe webhook signature failures so they appear in the in-app security dashboard.
- Added admin Security tab controls for exporting JSON/CSV security reports.
- Added audit retention and archival policy guidance for free in-app observability.
- Added a bounded development-only audit cleanup rehearsal script.
- Added admin-facing audit retention status to the in-app Security dashboard.
- Added audit retention status to exported JSON/CSV security reports.
- Added deployment readiness guardrails for audit retention envs and cleanup rehearsal coverage.
- Completed the free in-app security observability loop from Supabase/Postgres audit data.
- Added durable sign-out audit events without storing session tokens or provider payloads.
- Added sign-out lifecycle events to the in-app Security dashboard signal set.
- Added an admin account-lifecycle audit filter for support investigations.
- Added account-lifecycle totals to exported security reports.
- Added smoke coverage for authenticated admin lifecycle audit/report surfaces.
- Added server-side session identity freshness checks for authenticated API routes.
- Added explicit audit events when inactive accounts are rejected by authenticated API guards.
- Added inactive-account API rejections to the Security dashboard and account-lifecycle report totals.
- Added e2e coverage for support users querying account-lifecycle audit filters.
- Added operational guidance for immediate access revocation after account suspension or closure.
- Added account lifecycle summaries for suspended/closed account activity and rejection telemetry.
- Added account lifecycle summaries to the Security dashboard and exported security reports.
- Added deployment readiness guardrails for `dev`/`master` branch separation and Preview/Production auth URL mix-ups.
- Added CI push coverage for `dev` and explicit deployment-readiness guardrail checks for `dev` Preview and `master` Production pushes.
- Added a source-controlled environment matrix and drift check for Local, Preview/Dev, and Production runtime variables.
- Added a deployment alias policy check for Preview/Production hosts, OAuth callbacks, and documented database mapping.
- Added deployment readiness checks that block missing, development-scoped Production S3 prefixes and production-scoped Preview S3 prefixes.
- Added configurable max-session-age enforcement for sensitive admin mutation routes.
- Added deployment readiness validation for configured sensitive-session max-age values.
- Added a persisted user session revocation watermark so access changes force old JWT sessions through sign-in again.
- Added explicit session revocation context to user access-change audit metadata without exposing session tokens.

## In Progress

- Review Vercel Git integration and aliases so `dev` consistently deploys to Preview and `master` remains the only Production promotion branch.

## Next Targets

- Review whether user-facing messaging should distinguish forced re-authentication from generic auth expiry.
