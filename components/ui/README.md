# CMC UI Components

This folder is the future home for reusable browser-safe UI components.

- `primitives/` contains small presentational building blocks.
- Components here must not import `lib/server/*`, Prisma, Stripe, AWS, secrets, or `process.env`.
- Feature-specific composition should live under `components/features/*` once those folders are introduced.
- Tokens come from `styles/tokens.css` and `lib/design/tokens.js`.
