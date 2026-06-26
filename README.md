# CMC - Classical Music Catalogue

Original master’s dissertation prototype for a classical music backing-track catalogue.

The Next.js app now lives at the repository root. Production/project hardening is in progress. See:

- `HARDENING.md`
- `ENTERPRISE_ROADMAP.md`
- `RUNBOOK.md`
- `OPERATIONS_RUNBOOKS.md`
- `TESTING.md`
- `.env.example`

## Local Development

```bash
yarn install
yarn prisma generate
yarn dev
```

The app expects PostgreSQL, NextAuth provider credentials, Stripe keys, and S3 credentials. Use `.env.example` as the source of truth for required variables.

For local database-backed tests, use the Docker Postgres service that mirrors CI:

```bash
yarn db:local:up
yarn db:local:migrate
```

## Deployment Smoke Tests

```bash
SMOKE_BASE_URL=https://classical-music-catalogue.vercel.app yarn smoke
```

The smoke test checks public pages, baseline security headers, sign-in provider surface, unauthenticated denial for privileged APIs including admin operations, and optional synthetic fixture streaming. It is designed to run against Vercel Preview before promotion and Production after release.

## Original Context

Classical Music Catalogue:

https://classical-music-catalogue.vercel.app/

Prototype stack:

- JS
- React.js
- Next.js
- Prisma
- PostgreSQL
- AWS
- Next_auth
- Stripe
- Formik
- Boostrap

This project formed the Computing Dissertation element of my Master Degree at Cardiff University.
