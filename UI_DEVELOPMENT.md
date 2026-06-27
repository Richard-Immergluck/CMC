# CMC UI Development Structure

This document defines how to approach UI modernization without weakening the security, release, and smoke-test guardrails.

## When To Start

Start UI implementation after:

- `RELEASE_GATES.md` is in use for Preview-to-Production promotion.
- Smoke tests pass against the current Preview deployment.
- Browser-surface secret scanning remains green in `yarn sanity`.
- The first UI PR can be limited to structure, tokens, and one low-risk surface.

## Proposed Frontend Structure

Keep the current Pages Router until a separate routing migration is justified. Introduce UI structure gradually:

```text
components/
  ui/
    primitives/
    feedback/
    forms/
    layout/
    navigation/
  features/
    admin/
    catalogue/
    checkout/
    profile/
    upload/
lib/
  design/
    tokens.js
    theme.js
styles/
  globals.css
  tokens.css
```

Principles:

- `components/ui/*` contains reusable presentational components only.
- `components/features/*` contains workflow-specific composition.
- Browser components must not import `lib/server/*`, secrets, Prisma, Stripe, AWS, or `process.env`.
- Data access remains in API routes, server-side props, or server-only modules.
- Existing smoke and E2E journeys must stay green after each visual PR.

## Design Token Plan

Create tokens before redesigning screens:

- Color: background, surface, border, text, muted text, accent, success, warning, danger.
- Typography: body, heading, compact table text, form labels, metadata.
- Spacing: page, section, panel, form row, table density.
- Radius: keep controls and cards restrained; default card radius should remain 8px or less.
- Motion: minimal, functional transitions only.

Token output should be plain CSS variables in `styles/tokens.css`, optionally mirrored by `lib/design/tokens.js` for component logic.

Theme variants should override semantic variables through `[data-cmc-theme="..."]` or `.cmc-theme-*` classes. Keep page styles pointed at semantic variables, such as `--cmc-theme-page-background` and `--cmc-theme-heading`, so light and dark palettes can be changed without rewriting components.

## AI-Assisted Theme Workflow

Use AI for exploration, not direct unreviewed production styling:

1. Generate 3-5 visual directions as moodboards outside the app.
2. Score each direction against the product audience: non-technical musicians, catalogue browsing, purchasing, upload, and admin review.
3. Select one direction and reduce it to design tokens.
4. Implement tokens and primitives in a dedicated PR.
5. Apply to one workflow first, ideally catalogue or auth/profile shell, then run visual and functional checks.

Prompt constraints for AI theme generation:

- Classical music backing-track marketplace.
- Calm, trustworthy, musician-friendly, not developer-oriented.
- Avoid dark-only, purple-heavy, beige-heavy, or ornamental palettes.
- Prioritize readability, catalogue scanning, form clarity, and accessible contrast.
- Produce token candidates and component examples, not large page rewrites.

## UI PR Sequence

1. Add tokens, base primitives, and Storybook-equivalent examples or lightweight component fixtures.
2. Normalize layout/navigation shell without changing business logic.
3. Modernize catalogue listing and track detail.
4. Modernize auth/profile/purchases.
5. Modernize upload flow.
6. Modernize admin review/operations surfaces.
7. Add visual regression coverage once the component structure stabilizes.

Each PR should include:

- `yarn sanity`
- `yarn test:unit`
- relevant Playwright flow
- screenshot review for touched pages
- confirmation that no security/smoke guardrail was weakened

## Accessibility And Enterprise Criteria

- All controls have accessible names.
- Form validation is visible and announced.
- Tables remain scannable at desktop widths and usable on mobile.
- Focus states are visible.
- Text contrast meets WCAG AA.
- Loading, empty, error, and success states are explicit.
- Payment, ownership, upload, and admin actions remain server-authoritative.

## Non-Goals For The First UI Pass

- No routing migration.
- No marketing landing page.
- No new auth/payment/storage behaviour.
- No generated code copied wholesale into production without token/component review.
- No UI framework migration until the current surfaces are mapped.
