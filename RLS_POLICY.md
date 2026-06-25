# CMC RLS And Data API Policy

This document defines the intended Supabase Row Level Security and grant posture for CMC.

CMC currently uses server-side Prisma over `DATABASE_URL`. The browser does not use `supabase-js`, the Supabase anon key, PostgREST, or GraphQL for application table reads/writes. That means table authorization is enforced in server-side application code, with Supabase RLS and grants used as defense in depth against accidental Data API exposure.

## Current Access Model

Runtime access:

- Next.js API routes and server-rendered pages use Prisma through a Postgres connection string.
- Browser code talks only to CMC API routes.
- Browser code must never receive Supabase `service_role`, secret, or database credentials.
- Browser code must not receive a Supabase anon key unless a future PR explicitly introduces a reviewed browser-side Supabase access model.

Operational access:

- Prisma migrations are applied through controlled deployment/CI flows.
- Support/admin database inspection happens through trusted consoles or future admin tooling, not public Supabase table grants.

## Table Classification

Server-only auth/session tables:

- `Account`
- `Session`
- `User`
- `VerificationToken`

Server-only catalogue and marketplace tables:

- `Track`
- `TrackOwner`
- `Comment`
- `Order`
- `OrderItem`
- `PaymentEvent`
- `AuditEvent`

Server-only migration table:

- `_prisma_migrations`

No current application table is intentionally exposed through Supabase Data API roles.

## Grant Policy

For all application tables in the `public` schema:

- `anon`: no direct table access.
- `authenticated`: no direct table access.
- application/database connection role: access through direct Postgres connection, not Supabase Data API grants.
- migration/admin role: migration access only through controlled operational flows.

For future tables:

- Public schema default privileges should not automatically grant table or sequence access to `anon` or `authenticated`.
- If a future feature intentionally uses Supabase Data API, the PR must include explicit grants, RLS policies, tests, and this document must be updated.

## RLS Policy

All application tables in the `public` schema should have RLS enabled.

Because CMC does not currently expose direct browser-side Supabase table access, most tables should have no `anon` or `authenticated` policies. This is intentional: direct Data API access should fail before row policy evaluation.

Future browser-side policies must:

- Use `TO anon` or `TO authenticated` instead of deprecated role checks.
- Avoid `auth.role()` predicates.
- Avoid `user_metadata` / `raw_user_meta_data` for authorization.
- Use ownership predicates for user-scoped data.
- Include both `USING` and `WITH CHECK` for update policies.
- Be covered by tests or a documented manual verification path.

## Verification Requirements

Each migration touching grants, RLS, or public-schema tables must verify:

- RLS remains enabled on all application tables.
- `anon` and `authenticated` do not have direct table grants unless deliberately introduced.
- New public tables are covered by this policy.
- Prisma server-side application flows still work in Preview against CMBC Development.
- GitHub CI `prisma migrate deploy` passes.

Critical application flows to smoke after RLS/grant changes:

- Sign in/session persistence.
- Catalogue browse.
- Upload signing and track creation.
- Stripe checkout creation.
- Stripe webhook fulfilment.
- Profile ownership/download access.
- Unauthorized full/download denial.

## Release Gate

RLS/grant changes must be deployed to CMBC Development and verified through Preview before production migration.

Production promotion requires:

- CI green.
- Preview smoke test green.
- No new Supabase advisor findings for public application tables.
- Rollback path documented in the PR if grants are broadened.

