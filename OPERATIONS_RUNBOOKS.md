# CMC Incident Runbooks

Use these runbooks for Preview and Production incidents. Prefer Preview rehearsal before Production changes unless customer data or payments are actively affected.

## First Response

1. Identify the affected environment: local, Preview, Production, Supabase Development, or Supabase Production.
2. Capture the failing request path, `requestId`, deployment URL, approximate timestamp, and user-facing symptom.
3. Check GitHub Actions, Vercel deployment status, `/api/health`, Vercel runtime logs, Supabase project health, Stripe dashboard events, and AWS S3 object access.
4. Avoid changing secrets, database schema, or IAM policy until the likely failure mode is known.
5. Record the mitigation and follow-up PR in the release notes or incident notes.

## Health Diagnostics

Use health checks to separate app availability from dependency readiness.

Public shallow check:

```text
curl -s https://<deployment-host>/api/health
```

Expected healthy response shape:

```json
{
  "status": "ok",
  "service": "cmc",
  "environment": "preview",
  "commit": "abc123",
  "timestamp": "2026-06-29T08:00:00.000Z"
}
```

Protected deep check:

```text
GET https://<deployment-host>/api/admin/health
```

This route requires an authenticated `ADMIN` or `SUPPORT` user. Use it after infrastructure, secret, database, storage, Stripe, or auth changes. A healthy deep response returns HTTP `200` with `status: "ok"`. A dependency/configuration problem returns HTTP `503` with `status: "degraded"` and named checks such as `database`, `storage`, `stripe`, `auth`, and `databaseConnection`.

Triage:

1. If `/api/health` fails, inspect Vercel deployment status and runtime logs first; the application may not be serving.
2. If `/api/health` passes but `/api/admin/health` is degraded, inspect the failed named check before rotating credentials or changing schema.
3. Match runtime log entries using `requestId` and route telemetry events such as `health.shallow.completed` or `health.deep.completed`.
4. Treat missing environment names as configuration findings only; do not paste secret values into tickets, PRs, screenshots, or chat.

## Rate Limit Guardrails

The app applies conservative in-memory, per-instance rate limits to high-risk API routes such as upload signing, checkout creation/reconciliation, comments, and signed track URL issuance. These limits reduce accidental loops and low-effort abuse, but they are not a complete distributed throttling layer because serverless instances do not share memory.

Current enterprise upgrade path:

1. Keep the application-level limiter as a final local guardrail.
2. Add Vercel WAF/rate-limit rules for public abuse patterns at the edge.
3. Add a managed shared counter such as Redis/Upstash for user/IP limits that must be consistent across instances and regions.
4. Add dashboards/alerts for repeated `429` responses by route and actor.

Triage:

1. If a user reports `429 Too many requests`, capture the route, `requestId`, account email, approximate timestamp, and action they were repeating.
2. Check whether the route is being called in a loop from the UI or test automation.
3. Do not raise limits to hide a broken client loop; fix the client or workflow first.
4. For legitimate high-volume operational use, prefer a role-scoped or job-scoped endpoint with explicit quotas rather than disabling rate limits globally.

## Failed Checkout

Symptoms:

- Cart checkout returns an API error.
- User is not redirected to Stripe Checkout.
- Stripe has no matching checkout session.

Triage:

1. Search logs for `checkout.session_created` and the response `requestId`.
2. Confirm `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `ALLOW_SIMULATED_PURCHASES=false` are scoped to the affected Vercel environment.
3. Confirm the requested tracks are `PUBLISHED`, have positive `pricePence`, and are not already owned by the buyer.
4. Check Stripe dashboard API logs for rejected requests around the timestamp.
5. Verify `DATABASE_URL` points at the intended environment database.

Recovery:

1. If Stripe credentials are wrong, update the affected Vercel environment variables and redeploy.
2. If catalogue data is invalid, correct the track state or price in the development database first, then promote the data fix deliberately.
3. If checkout creation fails after an application release, roll back the Vercel deployment and open a fix PR.

## Failed Stripe Webhook

Symptoms:

- Stripe checkout succeeds but purchased tracks do not appear in the profile.
- Stripe webhook endpoint shows failures.
- Orders remain `PENDING`.

Triage:

1. In Stripe, inspect the webhook delivery for `checkout.session.completed`.
2. Search logs for `stripe.webhook_signature_failed`, `stripe.webhook_processed`, or `stripe.webhook_processing_failed`.
3. Match `stripeEventId`, `stripeEventType`, `orderId`, and `requestId`.
4. Confirm `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint for the exact deployment host.
5. Check whether the `PaymentEvent` row already exists; duplicate events should be idempotent.

Recovery:

1. Fix webhook secret/environment scoping if signature verification fails.
2. Use Stripe's retry delivery once the endpoint is healthy.
3. If fulfilment failed after payment, rerun the webhook from Stripe rather than manually editing ownership whenever possible.
4. If manual repair is unavoidable, create `TrackOwner`, `PaymentEvent`, and `AuditEvent` records together and record the incident.

## S3 Access Denied

Symptoms:

- Previews or downloads fail.
- Upload signed URL creation fails.
- Seed data uploads fail.

Triage:

1. Search logs for `upload.signed_url_issued` and `track.signed_url_issued`.
2. Confirm `S3_ACCESS_ID`, `S3_APP_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`, and `S3_KEY_PREFIX` are present and scoped to the affected environment.
3. Check AWS IAM for disabled, deleted, quarantined, or over-permissive access keys.
4. Confirm the object exists under the expected environment prefix.
5. In Preview/Development, verify whether `CMC_ENABLE_SYNTHETIC_FIXTURES=true` should be temporarily used.

Recovery:

1. Rotate compromised or quarantined IAM keys.
2. Restore least-privilege bucket/prefix permissions for only required object actions.
3. Re-seed synthetic/open test fixtures in development if test objects are missing.
4. Redeploy after changing Vercel environment variables.

## Database Migration Failure

Symptoms:

- GitHub CI fails at `prisma migrate deploy`.
- Vercel deployment fails during build or startup after schema changes.
- Supabase schema state differs between Development and Production.

Triage:

1. Stop further promotion until the failing migration is understood.
2. Check whether the failure is in Development, CI Postgres, or Production.
3. Inspect `_prisma_migrations` for applied migration names and failed records.
4. Confirm the branch was based on current `master` and includes all prior migration folders.
5. Run `yarn security:rls` after any schema migration that touches public tables.

Recovery:

1. For unmerged PRs, patch the migration and rerun CI.
2. For Development failures, restore from backup or rebuild the disposable database if no important data exists.
3. For Production failures, do not edit migration history casually. Create a forward-only repair migration after confirming the applied state.
4. Document the repair in `RUNBOOK.md` before promotion.

## Accidental Secret Exposure

Symptoms:

- A secret appears in GitHub, logs, screenshots, chat, Vercel output, or CI output.
- GitGuardian or another scanner reports a leaked credential.

Triage:

1. Treat the credential as compromised.
2. Identify provider, environment, permissions, and last known use.
3. Check whether the key grants read/write/delete access or payment/database privileges.
4. Do not rely on deleting the text from Git history as the only mitigation.

Recovery:

1. Revoke or deactivate the exposed key at the provider.
2. Create a replacement key with least privilege and environment-specific scope.
3. Update Vercel environment variables for only the affected environments.
4. Redeploy affected environments.
5. Search logs/provider audit trails for suspicious use.
6. Remove or redact the secret from documentation, screenshots, or logs where practical.

## Backup And Restore Drill

Cadence:

- Rehearse Development restore before relying on a Production restore path.
- Repeat after major schema changes or Supabase project changes.

Drill:

1. Export or download a Supabase backup for the selected environment.
2. Restore into a separate local or development database.
3. Run `prisma migrate deploy`.
4. Run `CMC_RUN_INTEGRATION_TESTS=true yarn test:integration`.
5. Run the smoke test against a Preview deployment pointed at the restored database.
6. Record restore duration, blockers, and any missing environment values.
