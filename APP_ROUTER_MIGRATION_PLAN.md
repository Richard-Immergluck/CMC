# CMC App Router Migration Plan

This plan moves CMC from the current Next.js Pages Router (`pages/*`) to the App Router (`app/*`) without weakening marketplace security, OAuth login, payment fulfilment, upload/download authority, or smoke-test confidence.

## Migration Decision

App Router migration epic: yes, after the auth preview-link consolidation PR is merged.

Reason: the public homepage, bespoke sign-in page, catalogue, profile, upload, admin, and API smoke coverage are now strong enough to protect incremental route migration. The migration should start as a structural epic, not as part of unrelated product UI work.

## Non-Negotiables

- Do not migrate all routes in one PR.
- Do not move authorization solely into middleware/proxy; every protected route/API must re-check server-side permission.
- Do not introduce browser-side Supabase data access during the migration.
- Do not change payment, S3, ownership, moderation, or role semantics unless a route migration reveals a bug that must be fixed.
- Do not share random Vercel preview URLs for HITL auth testing; use the stable preview alias.
- Keep Pages Router and App Router side by side only temporarily and route-family by route-family.

## Technical Principles

- Server Components by default: route pages should fetch server data directly or call server-only services.
- Client Components only for interactivity: search filters, preview toggles, cart interactions, upload forms, admin tabs, and comment forms.
- Lazy server dependencies: Prisma, Stripe, S3, email, and other SDKs should remain behind server-only/lazy helpers where build-time evaluation could otherwise touch missing env vars.
- Shared shell first: create an App Router layout that preserves current global providers, navbar, metadata, Bootstrap styles, and design tokens.
- Contract tests first: migrate a route only when public/auth/e2e tests already describe its expected behaviour.

## Target Structure

```text
app/
  layout.js
  page.js
  auth/
    signin/
      page.js
  catalogue/
    page.js
    [trackId]/
      page.js
  profile/
    page.js
    [trackId]/
      page.js
  upload/
    page.js
  cart/
    page.js
  admin/
    page.js
  api/
    ...
components/
  providers/
    AppProviders.js
  features/
    auth/
    catalogue/
    profile/
    upload/
    admin/
lib/
  server/
    ...
```

## Route Migration Order

### PR 1: App Shell Foundation

Goal: introduce `app/layout.js` and provider boundaries without migrating business flows.

Work:

- Extract current `_app.js` provider composition into a browser-safe `components/providers/AppProviders.js`.
- Keep `SessionProvider`, `CartProvider`, Bootstrap JS loading, navbar, and global styles working.
- Add `app/layout.js` and metadata matching the current `Header` component.
- Do not remove `pages/_app.js` yet.

Acceptance:

- `yarn build`, `yarn lint`, `yarn test:unit`, and existing Playwright smoke tests pass.
- Existing Pages Router routes still work.
- Stable preview alias still supports Google sign-in.

### PR 2: Public Static-ish Routes

Goal: migrate the lowest-risk public pages first.

Work:

- Move `/` from `pages/index.js` to `app/page.js`.
- Move `/auth/signin` to `app/auth/signin/page.js` only if NextAuth provider lookup and callback handling remain clean.
- Preserve authenticated `/` redirect to `/catalogue`.
- Keep visual output equivalent.

Acceptance:

- Anonymous homepage smoke passes.
- Bespoke sign-in page smoke passes.
- Signed-in `/` redirects to `/catalogue`.
- Mobile no-overflow tests pass.

### PR 3: Catalogue Listing

Goal: migrate the catalogue list while keeping interactive search isolated.

Work:

- Move `/catalogue` to `app/catalogue/page.js`.
- Fetch public track data in a Server Component.
- Extract search/filter/preview UI into a Client Component.
- Keep `publicTrackWhere` and server-side data shaping authoritative.

Acceptance:

- Public catalogue browse/search tests pass.
- Track counts and demo fixture visibility remain correct.
- Preview playback still works.

### PR 4: Catalogue Detail

Goal: migrate `/catalogue/[trackId]`.

Work:

- Use async route params in the App Router page.
- Keep invalid IDs and missing tracks returning not-found behaviour.
- Keep cart/customer actions as Client Components or API-backed flows.
- Preserve sample preview and back navigation behaviour.

Acceptance:

- Public track detail tests pass.
- Invalid route tests pass.
- Cart addition/purchase entry points still work.

### PR 5: Profile And Ownership Surfaces

Goal: migrate authenticated user profile pages.

Work:

- Move `/profile` and `/profile/[trackId]`.
- Use server session lookup and database ownership checks on the server.
- Keep comment submission and download actions backed by existing API routes or carefully introduced Server Actions.
- Preserve customer profile nav and purchased track access.

Acceptance:

- Authenticated profile smoke passes.
- Anonymous profile access redirects to bespoke sign-in with callback.
- Full playback/download authorization tests pass.
- Comment tests pass.

### PR 6: Upload Flow

Goal: migrate `/upload` without weakening signed URL or uploader approval rules.

Work:

- Move `/upload`.
- Keep upload form as a Client Component.
- Keep S3 key decisions and track creation server-authoritative through existing API/service boundaries.
- Preserve success modal behaviour.

Acceptance:

- Approved uploader upload flow passes.
- Customer upload guard passes.
- Upload signing API denial tests pass.

### PR 7: Admin And Support Console

Goal: migrate `/admin` after all customer-facing routes are stable.

Work:

- Move admin page to App Router.
- Keep role checks server-side.
- Split admin tabs into feature components only if it reduces risk and improves ownership.
- Preserve track review audio playback and operations surfaces.

Acceptance:

- Admin/support Playwright tests pass.
- User management remains admin-only.
- Track review remains admin/support-visible as intended.

### PR 8: API Route Handlers

Goal: migrate API routes only after page routes are stable.

Work:

- Convert `pages/api/*` to `app/api/*/route.js` in small groups.
- Start with low-risk read-only endpoints.
- Leave Stripe webhook, upload signing, signed track URLs, checkout, and auth until route-handler patterns are proven.
- Keep API helper contracts: method enforcement, request IDs, JSON errors, auth lookup, validation.

Acceptance:

- API methods/validation/auth-gate tests pass after each route group.
- Stripe webhook signature verification is explicitly tested before migrating webhook.
- S3 signed URL tests pass before migrating upload/download routes.

## NextAuth Plan

- Keep `pages/api/auth/[...nextauth].js` until the App Router shell and public pages are stable.
- When migrating NextAuth, move to `app/api/auth/[...nextauth]/route.js` in its own PR.
- Verify Google OAuth against the stable preview alias before and after migration.
- Preserve bespoke `/auth/signin` and callback URL behaviour.

## Proxy/Middleware Plan

Do not introduce `proxy.js` as an authorization gate in the first App Router PRs.

Potential later uses:

- Normalize legacy route redirects.
- Add high-level request header protections.
- Redirect obviously authenticated or unauthenticated shell routes only as convenience.

Never rely on proxy alone for admin, upload, checkout, ownership, or download authorization.

## Verification Matrix

Every migration PR should run:

- `yarn sanity`
- `yarn test:unit`
- `yarn lint`
- `yarn routes:check`
- `DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma?schema=public" yarn build`
- Relevant Playwright specs for touched routes
- `SMOKE_BASE_URL=https://classical-music-catalogue-richardimmerglucks-projects.vercel.app yarn smoke` after preview alias assignment

Customer/auth routes additionally require:

- Anonymous homepage and sign-in smoke.
- Google OAuth click-through reaches Google from the stable alias.
- Signed-in `/` redirects to `/catalogue`.
- Profile link appears only when authenticated.

Commerce/storage routes additionally require:

- Checkout ownership tests.
- Stripe webhook idempotency tests.
- Signed URL denial and success tests.
- S3/upload smoke where credentials are enabled.

## Rollback Strategy

- One route family per PR keeps rollback simple: revert the PR if the route regresses.
- Do not delete the Pages Router equivalent until the App Router route has passed Preview smoke and HITL where relevant.
- Keep API routes in Pages Router until their replacements have full method, validation, auth, and integration coverage.

## First Concrete PR

Start with PR 1: App Shell Foundation.

This should be a structural PR only. It should not redesign screens, change auth providers, change database schema, change commerce logic, or migrate API routes.
