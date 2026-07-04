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

Recommended launch tiers:

- Free
- GBP 1.99
- GBP 2.99 standard default
- GBP 4.99 premium
- GBP 6.99 specialist or rare

The default upload price should be GBP 2.99, with guidance that GBP 4.99 is appropriate for higher-quality, rare, or more carefully produced recordings. GBP 6.99 should be reserved for genuinely specialist material during the early marketplace phase.

Possible uploader guidance:

> Most CMC tracks are expected to sit between GBP 2.99 and GBP 4.99. Choose GBP 6.99 only for rare repertoire, high-production recordings, or specialist material that would be difficult for players to find elsewhere.

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
