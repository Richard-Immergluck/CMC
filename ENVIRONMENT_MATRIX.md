# CMC Environment Matrix

This matrix records where each runtime variable belongs and whether values must differ between Local, Preview/Dev, and Production. Keep it aligned with `.env.example`.

## Runtime Variables

| Variable | Local | Preview / Dev | Production | Separation rule |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Local Docker Postgres or disposable database | `CMBC Development` Postgres | `CMBC Production` Postgres | Must differ between Preview and Production. |
| `NEXTAUTH_URL` | `http://localhost:3000` | Stable preview alias or unset when request-host callbacks are safe | `https://classical-music-catalogue.vercel.app` | Production must not use the stable preview alias; Preview must not use the production host. |
| `NEXTAUTH_SECRET` | Local secret | Preview secret | Production secret | Prefer different values per environment. |
| `GOOGLE_CLIENT_ID` | Local/test OAuth client when needed | Preview OAuth client with stable preview callback | Production OAuth client with production callback | Preview and Production callback URLs must both be authorised. |
| `GOOGLE_CLIENT_SECRET` | Local/test OAuth secret when needed | Preview OAuth secret | Production OAuth secret | Prefer separate OAuth clients or strictly separated callback configuration. |
| `EMAIL_SERVER` | Optional local SMTP/test mailbox | Optional preview SMTP/test mailbox | Production SMTP | Must not send Preview email from a Production identity unexpectedly. |
| `EMAIL_FROM` | Optional local sender | Preview sender | Production sender | Prefer environment-specific sender names. |
| `ADMIN_ACCESS_REVIEW_EMAIL_RECIPIENTS` | Optional tester mailbox | Preview admin/test mailbox | Production admin/security mailbox | Production recipients must be real operational contacts. |
| `CMC_EXPECTED_PRODUCTION_BRANCH` | Optional; defaults to `master` | Optional | `master` | Production branch guardrail. |
| `CMC_EXPECTED_PREVIEW_BRANCH` | Optional | `dev` | Optional | Preview branch guardrail. |
| `CMC_ENABLE_SYNTHETIC_FIXTURES` | Optional for local demos | Allowed for Preview when S3 fixtures are unavailable | Must be unset or `false` | Production must not use synthetic fixtures. |
| `S3_ACCESS_ID` | Local/dev IAM user if needed | Dev-scoped IAM user | Production IAM user | Prefer separate IAM users; never reuse broad development deletion credentials in Production. |
| `S3_APP_ACCESS_KEY` | Local/dev secret | Dev-scoped secret | Production secret | Rotate independently per environment. |
| `S3_BUCKET_NAME` | Local/dev bucket | Dev bucket or shared bucket with dev prefix | Production bucket or shared bucket with prod prefix | Prefer separate buckets; otherwise prefix separation is mandatory. |
| `S3_REGION` | `eu-west-2` | `eu-west-2` | `eu-west-2` | Region should match platform target. |
| `S3_KEY_PREFIX` | Local/dev prefix | `development/` style prefix | `production/` style prefix | Must differ between Preview and Production. |
| `STRIPE_SECRET_KEY` | Stripe test secret | Stripe test secret | Stripe live secret | Preview must use test mode; Production should use live mode only when ready. |
| `STRIPE_WEBHOOK_SECRET` | Local Stripe CLI/webhook secret | Preview webhook secret | Production webhook secret | Must be endpoint-specific. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key | Stripe test publishable key | Stripe live publishable key | Must match `STRIPE_SECRET_KEY` mode. |
| `ALLOW_SIMULATED_PURCHASES` | Optional local escape hatch | Usually `false` | Must be unset or `false` | Production must not allow simulated purchases. |
| `DEMO_SEED_USER_EMAIL` | Local demo uploader | Preview/demo uploader | Not normally used | Seed only non-production environments. |
| `DEMO_SEED_USER_NAME` | Local demo name | Preview/demo name | Not normally used | Seed only non-production environments. |
| `SECURITY_ALERT_WINDOW_MINUTES` | Optional | Optional | Optional | Tune after observing real traffic. |
| `ADMIN_ACCESS_REVIEW_METRICS_WINDOW_DAYS` | Optional | Optional | Optional | Reporting-only. |
| `ADMIN_ACCESS_REVIEW_OVERDUE_HOURS` | Optional | Optional | Optional | Reporting-only. |
| `AUDIT_CLEANUP_RETENTION_DAYS` | Optional rehearsal | Development rehearsal only | Operational value only with written approval | Cleanup must not run without export/rationale. |
| `AUDIT_CLEANUP_EXECUTE` | `false` by default | `false` by default | `false` unless explicitly authorised | Production cleanup requires release/incident notes. |
| `AUDIT_CLEANUP_CONFIRM` | Empty by default | Confirmation token for dev rehearsal | Confirmation token only with approval | Must not be casually set in Production. |

## Deployment Mapping

| Git ref | Vercel environment | Database | URL |
| --- | --- | --- | --- |
| `dev` | Preview | `CMBC Development` | `https://classical-music-catalogue-richardimmerglucks-projects.vercel.app` |
| `master` | Production | `CMBC Production` | `https://classical-music-catalogue.vercel.app` |

## Hard Stops

- Do not point Preview at `CMBC Production`.
- Do not point Production at `CMBC Development`.
- Do not use the stable Preview alias as Production `NEXTAUTH_URL`.
- Do not use the Production host as Preview `NEXTAUTH_URL`.
- Do not enable `ALLOW_SIMULATED_PURCHASES` or `CMC_ENABLE_SYNTHETIC_FIXTURES` in Production.
- Do not share S3 prefixes between Preview and Production.
