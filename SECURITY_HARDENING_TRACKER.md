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

## In Progress

- Add audit events for sign-in denial and sensitive account lifecycle changes where useful without storing secrets or raw provider payloads.

## Next Targets

- Review database RLS/schema posture for audit event immutability and public table exposure.
- Review storage key scoping and signed URL expiry policy against product requirements.
- Add observability runbooks for security-relevant events and alert-worthy patterns.
