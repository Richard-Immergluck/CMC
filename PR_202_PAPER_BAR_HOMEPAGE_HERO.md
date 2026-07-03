# PR 202: Paper Bar Homepage Hero

Pull request: https://github.com/Richard-Immergluck/CMC/pull/202  
Branch: `codex/cmc-logo-svg-options`  
Primary commit: `c333af7`  
Status: Draft PR

## Purpose

This PR implements the first production pass of the Paper Bar visual system across the CMC homepage and navigation. The goal was to move the app away from generic SaaS presentation and toward the refined, contemporary conservatoire direction established in the brand exploration: textured paper, charcoal staff-line rhythm, catalogue-grid fragments, restrained colour, and institutional typography.

## User-Facing Changes

- Rebuilt the homepage hero around the Paper Bar visual language.
- Added the final Paper Bar logo mark to the navbar.
- Simplified the navbar to focus on `Catalogue` and `Login / Sign up`.
- Added the full desktop navbar wordmark: `CMC | Classical Music Catalogue`.
- Preserved a shorter compact wordmark treatment for mobile.
- Made the navbar sticky with a transparent outside area and glass-style inner panel.
- Added live hero metrics for tracks, uploaders, requests, and comments.
- Moved the `How it works` section directly under the hero metrics.
- Reversed the section gradient treatment for the `How it works` band.
- Added reusable light and dark CMC button styles to the hero CTAs.

## Hero Composition

The new homepage hero is built from layered brand elements:

- A textured vertical parchment column.
- A continuous charcoal staff-line motif crossing the hero.
- A DS01 catalogue-grid artwork fragment on the right side.
- Large editorial display text:
  - Blue initial `B`.
  - Gold custom dot over the `i` in `Backing`.
  - Gold full stop at the end of the headline.
- A compact description and two calls to action.
- Real platform activity metrics aligned under the hero copy.

The current right-side artwork uses:

```css
.cmc-home-hero-dead-space--ds01 {
  background-image: url('/brand/motifs/dead-space/catalogue-grid-field.svg');
}
```

The artwork is intentionally desktop-only for this pass and is hidden under the tablet breakpoint.

## Button System

Two reusable button variants were added:

- `cmc-button--paper`
  - Light surface.
  - Gold register strip on the left.
  - Sharp rectangular shape.
  - Used for `Browse catalogue`.

- `cmc-button--ink`
  - Filled dark green/ink surface.
  - Gold register strip on the left.
  - Sharp rectangular shape.
  - Used for `Join the community`.

The variants are also available through `components/ui/primitives/Button.js` as:

```js
variant="paper"
variant="ink"
```

## Navbar And Logo Work

`components/brand/BrandMark.js` now uses the Paper Bar raster logo through `next/image` instead of the earlier inline SVG mark.

The navbar uses:

```jsx
<BrandMark compact wordmark="navFull" />
```

The desktop treatment shows:

- Paper Bar mark.
- `CMC`.
- Divider rule.
- `Classical Music Catalogue`.

The mobile treatment hides the divider and full title so the navbar remains compact.

## Data Changes

`app/page.js` now fetches homepage metrics server-side:

- Public track count.
- Uploaders with at least one public track.
- Request count, guarded for environments where `userAccessChangeRequest` is unavailable.
- Comment count scoped to public tracks.

The values are passed into `HomePageContent` as `heroStats`.

## Brand Assets Added

### Final logo assets

Stored in:

```text
public/brand/logo/
```

Key files:

- `paper-bar-final-transparent-large.png`
- `paper-bar-final-transparent-small.png`
- `paper-bar-large-transparent.png`
- `paper-bar-small-transparent.png`
- `paper-bar-transparent-preview.png`
- `README.md`

### Homepage motif assets

Stored in:

```text
public/brand/motifs/
```

Key files:

- `paper-bar-hero-staff.svg`
- `paper-parchment-column.png`
- `paper-parchment-column.svg`

### Dead-space artwork candidates

Stored in:

```text
public/brand/motifs/dead-space/
```

Files:

- `catalogue-grid-field.svg` (`DS01`, currently used in the hero)
- `archive-register.svg` (`DS02`)
- `catalogue-ledger-block.svg` (`DS03`)
- `index-card-fragment.svg` (`DS04`)

Review page:

```text
public/brand/review/dead-space-art.html
```

Local URL:

```text
http://localhost:3000/brand/review/dead-space-art.html
```

### Paper Bar texture explorations

Stored in:

```text
public/brand/type/paper-bar-display/
```

This includes parchment, teal, gold, red, and ink texture files plus review pages for the motif system.

## Catalogue Styling Touches

The PR also begins carrying the Paper Bar language into catalogue surfaces:

- Catalogue hero background receives register/grid styling.
- Track cards receive coloured left register strips and staff-like row structure.
- Track metadata markers are added as small colour signals.
- Catalogue action styling is adjusted to better match the new visual system.

These changes are part of setting up a broader app-wide design language, but the homepage remains the main focus of the PR.

## Files Changed

Primary implementation files:

- `app/page.js`
- `components/Navbar.js`
- `components/brand/BrandMark.js`
- `components/features/home/HomePageContent.js`
- `components/features/catalogue/CataloguePageContent.js`
- `components/ui/primitives/Button.js`
- `styles/globals.css`
- `styles/tokens.css`
- `next.config.js`

Primary asset directories:

- `public/brand/logo/`
- `public/brand/motifs/`
- `public/brand/review/`
- `public/brand/type/paper-bar-display/`

Removed superseded assets:

- `public/brand/cmc-logo-option-01.svg`
- `public/brand/cmc-logo-option-02.svg`
- `public/brand/cmc-logo-option-03.svg`
- `public/brand/cmc-logo-option-04.svg`
- `public/brand/cmc-logo-option-05.svg`

## Validation

Completed:

- `yarn lint`
- Local visual checks in the in-app browser at:

```text
http://localhost:3000/
```

Also reviewed during implementation:

- Desktop homepage hero.
- Navbar wordmark alignment.
- Transparent logo behavior against the glass navbar.
- Button styles with and without lateral line texture.
- Dead-space artwork scale studies.

## Known Notes

- The PR is intentionally still draft because this is a visual/design milestone.
- `gh auth status` reports an invalid local GitHub CLI token, but the branch was pushed successfully and the PR was created through the GitHub connector.
- Local untracked exploration files were intentionally not included:
  - `.DS_Store`
  - `tmp/`
  - `output/`
  - loose old staff-mark source PNG files
  - old PDF logo generator scripts

## Likely Follow-Ups

- Decide whether DS01 remains the hero-right artwork or whether DS03 should be tested in the same final position.
- Continue applying the Paper Bar button system across catalogue, upload, auth, and profile flows.
- Move from exploratory brand review pages toward a durable internal brand reference page.
- Audit mobile spacing after more homepage sections are finalized.
- Decide whether the catalogue styling changes should remain in this PR or be split into a follow-up design-system PR if the review scope feels too wide.
