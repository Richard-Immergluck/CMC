# CMC Hybrid 01 Web App Integration

Hybrid 01 should become a structural design language, not a decorative overlay. The useful ingredients are:

- Staff-line dividers: horizontal rules that organize information like a score.
- Archive strip: a vertical ivory/gold paper band used sparingly for emphasis, active states, or section anchoring.
- Catalogue grid: precise columns, metadata dots, and index marks for browsing and comparison.
- Warm institutional palette: ivory, charcoal, muted gold, muted teal, restrained red.

## 1. Brand Mark

Replace the current folded-document mark with a Hybrid 01 mark:

- Five staff-like lines crossing a vertical archive strip.
- A small group of metadata dots on the right.
- One muted gold square or dot as the catalogue accent.
- Keep the mark flat and reducible for navbar, favicon, and profile badges.

Current file: `components/brand/BrandMark.js`

## 2. Navbar

Use a calmer, editorial navbar instead of Bootstrap's default light bar:

- Warm ivory surface.
- Thin charcoal/gold bottom rule.
- Compact mark plus wordmark.
- Active route indicated by a tiny metadata dot or vertical archive-strip sliver, not a pill.

Current file: `components/Navbar.js`

## 3. Home Hero

The hero should borrow A1's quiet written-record atmosphere:

- Add a large, subtle staff-line field behind the headline.
- Place a translucent vertical archive strip behind the brand lockup or along the left margin.
- Use a small metadata-dot cluster near the CTA row.
- Avoid gradients as the primary brand signal.

Current file: `components/features/home/HomePageContent.js`

## 4. Catalogue Listing

This is where B1 can do real product work:

- Replace card-like rows with a catalogue-sheet/list system.
- Use fixed metadata columns for key, instrumentation, uploader, duration, price.
- Use dots/squares to show states such as preview available, purchased, requested, discussed, featured.
- Let row dividers resemble staff lines, with slightly heavier section bars every few rows.
- Use the archive strip as the hover or selected-row accent.

Current file: `components/features/catalogue/CataloguePageContent.js`

## 5. Search And Filters

The filter panel can feel like an accession/index card:

- Vertical archive strip on the left edge.
- Search input as an indexed catalogue field.
- Filter groups divided by staff-line rules.
- Result count shown as small catalogue metadata, not a big stat card.

Current class group: `.cmc-catalogue-panel`

## 6. Track Detail

The track page can use the staff/grid language more directly:

- Header becomes a score archive sheet: title/composer on the left, purchase panel on an indexed right column.
- Waveform area sits inside a staff-line frame.
- Metadata list becomes a clean catalogue grid.
- Comments and requests use metadata-dot state marks.

Current page/component: `components/features/catalogue/CatalogueTrackDetailContent.js`

## 7. Profile And Community

Profiles can use the dot language for contribution/reputation:

- Purchased, uploaded, commented, requested states become small dot clusters.
- Uploader cards can use a vertical archive strip for trusted/featured contributors.
- Activity lists can use staff-line dividers instead of boxed cards.

Current file: `components/features/profile/ProfilePageContent.js`

## Design Guardrails

- Use the motif as layout structure first, ornament second.
- Keep cards rare; prefer unframed rows, rules, strips, and grids.
- One accent per surface is enough: either gold strip, teal block, or red annotation.
- Maintain black-and-white viability by ensuring the structure still works without color.
- Do not add literal notation, clefs, instruments, microphones, or headphones.
