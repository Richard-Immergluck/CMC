# CMC - Classical Music Catalogue

Original master’s dissertation prototype for a classical music backing-track catalogue.

The active app lives in:

```text
trax/
```

Production/project hardening is now in progress. See:

- `HARDENING.md`
- `RUNBOOK.md`
- `trax/.env.example`

## Local Development

```bash
cd trax
yarn install
yarn prisma generate
yarn dev
```

The app expects PostgreSQL, NextAuth provider credentials, Stripe keys, and S3 credentials. Use `trax/.env.example` as the source of truth for required variables.

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
