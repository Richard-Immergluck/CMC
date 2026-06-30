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

## In Progress

- Build free in-app security observability from Supabase/Postgres audit data.

## Next Targets

- Add admin-facing audit retention status to the in-app Security dashboard.
