# CMC Commercial Policy Notes

These notes capture the current product direction for track pricing, uploader payouts, and buyer-facing checkout language. They are internal working guidance, intended to be revisited when CMC prepares uploader sales documentation, marketplace terms, and payment/payout implementation.

## Product Position

CMC should be a community-led marketplace for classical rehearsal and backing tracks. The platform should give uploaders meaningful control over their work while keeping buyer pricing simple, fair, and easy to understand.

The buyer should see one clear track price at checkout. CMC should avoid adding a separate mandatory platform fee on top of the listed track price during the early product phase, because small digital purchases can feel less trustworthy when extra fees appear late in checkout.

## Market Reference

Initial market checking found that YourAccompanist sells individual classical piano accompaniment MP3 downloads at around GBP 2.99 per track. PianoTrax appears to emphasise a large accompaniment catalogue and app/subscription/custom-track access rather than a simple visible single-track public price.

Useful reference links:

- https://www.youraccompanist.com/
- https://www.pianotrax.com/
- https://get.bandcamp.help/en/articles/15263322-what-pricing-performs-best

These references suggest that CMC should not treat GBP 8.50 as the normal default for a single track at launch. GBP 8.50 may still make sense for specialist, rare, bundled, or high-production tracks later.

## Launch Pricing Direction

Uploaders should be able to choose their track price, but only from guided price tiers. This gives uploaders agency without making the marketplace feel inconsistent or chaotic.

Recommended launch bands:

- Short or simple single track: GBP 1.99-2.99.
- Standard single track: GBP 2.99-3.99.
- Higher-value single track or substantial movement: GBP 3.99-6.99.
- Opera excerpt or specialist cut: GBP 3.99-8.99.
- Learning pack, multiple tempi, multiple versions, or practice set: GBP 7.99-14.99.
- Song cycle or collection: GBP 9.99-29.99.
- Complete work, full opera material, or unusually large reduction: admin-reviewed pricing, usually GBP 19.99+.

The default upload price for a normal single track should be GBP 2.99. CMC should avoid treating GBP 5.99 as the normal baseline for a five-minute aria, because many uploads will be useful community recordings rather than professional studio products.

Possible uploader guidance:

> Most CMC single tracks are expected to sit between GBP 1.99 and GBP 3.99. Choose higher prices only for longer, rarer, more complete, or more carefully produced material.

## Tracks, Works, and Collections

CMC should distinguish the atomic audio file from the larger musical product.

- A track is the individual uploaded audio file.
- Works & Collections are higher-level catalogue items that can contain one or more approved tracks.
- A Work or Collection may represent a song cycle, curated set, learning pack, complete work, opera group, or other grouped product.

This keeps a single Schubert lied, a concerto movement, a warm-up track, and a complete opera reduction from being forced into the same pricing and metadata shape.

Recommended single-track pricing types:

- Song, aria, study, or warmup.
- Movement or substantial excerpt.
- Opera number or specialist cut.

Recommended Works & Collections types for the later grouping flow:

- Learning pack.
- Song cycle.
- Collection.
- Complete work.

The single-track upload flow should only price the individual audio file being uploaded. It should not ask uploaders to price a song cycle, collection, or complete work when they have uploaded one MP3. The Works & Collections manager allows uploaders to group existing approved tracks into one purchasable item, set track order, maintain individual-track purchase options, and choose a fair grouped price.

Works & Collections release lifecycle:

- Normal guided-price releases can publish immediately.
- Releases above the pricing review threshold are created as submitted for review and must not be public until an admin approves the price.
- Admin approval publishes the release.
- Admin rejection moves the release into a needs-changes state so the uploader can edit and resubmit with a more suitable price or structure.
- Archived releases are removed from public sale while preserving existing buyer library access.

Bulk upload should be treated as a separate operational workflow:

- Uploaders may select or drop many MP3 files at once.
- Each file becomes an individual draft track.
- The uploader can apply shared metadata such as composer, instrumentation, and default price across the batch.
- The uploader can then edit per-track titles, keys, durations, preview positions, notes, and prices before submission.
- After moderation, those approved tracks can be attached to Works & Collections.

## Request Fulfilment Pricing

Request fulfilment needs extra protection because a requester may have a specific musical need. CMC should not allow an uploader to accept a request and then exploit that need by setting an excessive price.

Principles:

- A request can justify a fair premium for bespoke work.
- A request should not justify opportunistic pricing.
- The requester should see and accept the proposed price before work is treated as fully accepted.
- Any price above the normal catalogue band should require admin review.
- Pricing proposals should be auditable.

Recommended request flow:

1. User creates a request.
2. Uploader marks the request as under consideration or accepted in principle.
3. Uploader proposes a fulfilment price using the same guided catalogue bands.
4. If the proposed price exceeds the normal range, the proposal is flagged for admin review.
5. Requester accepts or declines the proposed price before the uploader proceeds.
6. If the uploader fulfils the request, the resulting uploaded track is attached back to the original request.

This keeps request fulfilment community-led while still recognising that bespoke preparation may require more labour than uploading an existing file.

## Revenue Split

The preferred model is a transparent commission split rather than a separate buyer-facing platform fee.

Recommended starting point:

- Buyer pays one listed track price.
- Payment processing fees are deducted.
- Remaining net revenue is split between uploader and CMC.
- Suggested split: 70% uploader / 30% CMC.

Alternative community-friendly split:

- 75% uploader / 25% CMC.

The 70/30 split is likely more sustainable while the platform is small, because CMC needs revenue to cover development labour, hosting, storage, moderation, support, maintenance, payment operations, and future product improvements.

Important implementation principle:

> Payout percentages should be calculated from net revenue after payment processing fees, not gross sale value, unless CMC explicitly decides to absorb payment fees itself.

Example:

- Buyer pays GBP 2.99.
- Stripe/payment processor fee is deducted.
- Net revenue is split 70% to uploader and 30% to CMC.

## Buyer-Facing Checkout Language

Checkout should remain simple:

- Show the track price.
- Show the total.
- Do not show a mandatory extra platform fee at launch.
- Do not surprise the buyer with extra charges late in checkout.

Recommended buyer-facing framing:

> Your purchase supports the uploader and helps maintain CMC.

Avoid:

- Late-stage compulsory platform fees.
- Complex fee explanations during checkout.
- Language that makes CMC feel like a ticketing platform.

## Uploader-Facing Language

Uploader documentation should be transparent about the platform share.

Possible uploader-facing wording:

> Uploaders earn 70% of net track revenue after payment processing. The remaining share helps maintain CMC, host audio files, moderate uploads, support users, and improve the platform.

This should be reviewed before publication for legal, tax, payment-provider, and consumer-rights implications.

## Future Options

These should not block the first commercial version, but are worth preserving for later:

- Optional buyer support: allow buyers to pay more than the listed price to support an uploader.
- Bundles: allow uploaders to sell sets of related tracks at a bundled price.
- Request fulfilment: price separately from catalogue downloads, because bespoke work has different labour value.
- Uploader profiles: show sales/download counts, comments, request fulfilment, and community reputation.
- Promotional pricing: allow temporary discounts or free community releases.
- Platform-funded campaigns: CMC may choose to waive or reduce its share for specific community initiatives.

## Open Decisions

- Final launch split: 70/30 or 75/25.
- Whether payment processing fees are deducted before or after the revenue split.
- Whether VAT/sales tax obligations affect displayed prices.
- Whether uploaders need a minimum payout threshold.
- Whether CMC will support free tracks at launch or only after uploader verification.
- Whether GBP 6.99 should be the initial cap, or whether admin-approved exceptions should exist.
