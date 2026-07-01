# UI Development Tracker

## Current UI Cycle

Status: Active

Focus: establish the Classical Music Catalogue brand foundation, reusable design primitives, and a coherent visual direction before broader page redesigns.

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

Status: In progress

Goals:

- [x] Add semantic component tokens for controls, buttons, panels, and catalogue rows.
- [x] Mirror component tokens through `lib/design/tokens.js` for testable JavaScript access.
- [x] Apply shared primitives to the catalogue filtering and result surfaces.
- [x] Apply shared primitives to ownership and admin surfaces.
- [x] Apply shared primitives to profile surfaces.
- [x] Apply shared primitives to auth and upload surfaces.
- [ ] Add visual QA snapshots for public, catalogue, auth, and mobile breakpoints.

## Next UI Targets

- Formalise component-level tokens for buttons, panels, forms, tables, filters, audio controls, and navigation.
- Run a catalogue page design pass against the brand foundation, including mobile behaviour and longer seeded track lists.
- Audit auth, upload, profile, ownership, and admin surfaces for consistent layout and interaction patterns.
- Create visual QA snapshots for core breakpoints before larger aesthetic changes.
