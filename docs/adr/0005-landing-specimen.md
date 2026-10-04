# ADR-0005: Landing direction revised again — Specimen

- Status: Accepted (supersedes ADR-0004's direction choice)
- Date: 2026-10-01

## Context

After Living (ADR-0004) shipped to the landing, the three prototype
directions were compared once more in the browser and the first direction,
**Specimen**, was chosen as the final one. The global button classes
introduced by ADR-0004 are unaffected and remain in force.

## Decision

Adopt **Specimen** as the landing direction: cube-motion's own page layout
translated onto the vccs token layer — copy left (eyebrow pill, 60px display
title, 17px lede, cube buttons), a real chart in a 24/10/14 card right with
a mono spec caption, and a four-card stat strip below (30+ variants, 7
categories, 1 peer dependency, 100% typescript). `HeroChartBackground.vue`
is removed again — Specimen has no background layer.

## Rejected

- **Living** (ADR-0004's choice) — memorable, but the moving background
  still splits attention with the headline and costs a wash gradient for
  legibility; Specimen shows the product with zero competition.
- **Manifesto** (ADR-0003's choice) — charts below the fold.

## Consequences

- `docs/app/pages/index.vue` is the Specimen layout; this is the third and
  intended-final direction — the comparison trail lives in ADR-0003/0004/0005
  so the rejected options don't get re-proposed without new information.
- The landing now shows a static real chart (`gradient-area-chart`) instead
  of a streaming one; entrance motion is CSS-only (`--ds-enter` /
  `--ds-stagger` / `--ds-ease`), no `motion-v` on this page.
