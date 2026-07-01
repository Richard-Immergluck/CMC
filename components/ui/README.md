# CMC UI Components

This folder is the future home for reusable browser-safe UI components.

- `primitives/` contains small presentational building blocks.
- Components here must not import `lib/server/*`, Prisma, Stripe, AWS, secrets, or `process.env`.
- Feature-specific composition should live under `components/features/*` once those folders are introduced.
- Tokens come from `styles/tokens.css` and `lib/design/tokens.js`.
- Component tokens use the `--cmc-component-*` namespace for control heights, button tones, panels, table rows, and future audio controls.
- Prefer primitive props such as `variant`, `size`, and `tone` over ad hoc feature CSS when the behaviour is shared across pages.
