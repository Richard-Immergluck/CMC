# UI Development Tracker

## Current UI Cycle

Status: Active

Focus: prepare a coherent dev-deployment design review before deeper page redesigns.

## Backend Polish Handoff

Backend and security hardening is in a good enough state to begin UI work, but it is not closed. Continue tracking the deeper security queue in `SECURITY_HARDENING_TRACKER.md`.

Open backend polish to return to:

- Classify sensitive mutation routes for stricter session-age controls.
- Decide whether to add a server-side session denylist beyond the current user/session visibility model.
- Add configurable maximum-session-age checks for high-risk operations if the route classification justifies it.

## UI Sprint 1: Brand Foundation

Goals:

- [x] Replace the old CMBC working-title presentation with Classical Music Catalogue.
- [x] Add a reusable brand mark and wordmark component.
- [x] Document the design direction before component and page-level redesigns begin.
- [x] Keep palette decisions token-led so dark and alternate light schemes remain possible later.

## UI Sprint 2: Component System

Status: Complete

Goals:

- [x] Add semantic component tokens for controls, buttons, panels, and catalogue rows.
- [x] Mirror component tokens through `lib/design/tokens.js` for testable JavaScript access.
- [x] Apply shared primitives to the catalogue filtering and result surfaces.
- [x] Apply shared primitives to ownership and admin surfaces.
- [x] Apply shared primitives to profile surfaces.
- [x] Apply shared primitives to auth and upload surfaces.
- [x] Add visual QA snapshots for public, catalogue, auth, and mobile breakpoints.

## UI Sprint 3: Dev Design Review

Status: Ready for HITL preparation

Goals:

- [ ] Confirm the latest `master` deployment is available on Vercel Dev or Preview.
- [ ] Run visual QA screenshots against the same build that will be reviewed.
- [ ] Ask for manual review of the public homepage, catalogue, auth, upload guard, profile, and admin surfaces.
- [ ] Review local untracked design exploration files and decide which PNG/PDF/script assets should be kept, archived, ignored, or deleted.
- [ ] Capture design feedback as grouped follow-up PRs rather than piecemeal CSS changes.
- [ ] Decide whether to begin deeper catalogue page redesign or theme/dark-mode work first.

## Next UI Targets

- Confirm the current dev deployment and perform a physical design review.
- Clean up local untracked design exploration files after deciding which source/export assets are useful.
- Run a catalogue page design pass against review feedback, including mobile behaviour and longer seeded track lists.
- Add theme controls only after the first reviewed light theme is coherent.
- Refine admin/profile density after the catalogue and public experience are directionally settled.
