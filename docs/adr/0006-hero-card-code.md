# ADR-0006: Hero card — tabbed chart + code (shiki-magic-move), morphing area background

- Status: Accepted
- Date: 2026-10-02

## Context

ADR-0005's Specimen landing shipped with a single static Gradient Area in
the hero card — judged too monotonous for a library with 30+ chart types. A
prototype run (`/proto/hero-card`, since removed) compared five card
directions inside the unchanged landing.

## Decision

**Code** — cube-motion's signature pattern: tab switcher (Area / Bar / Pie /
Radar), the live chart on the left and its real `<template>` code on the
right, kept in sync on every switch. Three layers of shared-element motion:

- Tab chip slides between tabs via motion-v `layout-id`
- Chart morphs via `AnimatePresence` (320ms enter / 160ms exit, blur 4px)
- Code animates token-by-token via **shiki-magic-move** (600ms) — unchanged
  tokens slide to their new positions instead of the block crossfading

Auto-rotate every 3.2s, paused on hover, off under reduced motion. Chart
heights are fixed (160px) so tab switches never change the card's layout;
code-height changes are handled by magic-move's own container animation
(motion `layout` was tried and rejected — FLIP scaleY squashes text).

**Page background**: a live chart fixed behind the whole landing that
**renders the same chart type as the card's active tab** (area wave, bar
field, donut, or radar — all axis-less, morphing data, switched with the
same blur-morph as the card, opacity 0.55, top/bottom/left washes for
legibility, 64px right inset). The card lifts its active key via
`v-model:active`; the background is a pure function of it. Static under
reduced motion.

Styles are Tailwind v4 utilities on `--ds-*` tokens throughout (no scoped
CSS in the card component).

## Rejected directions (from the same run)

- **Baseline** (single static area) — the monotony being fixed.
- **Rotate** (auto-cycling charts, no code) — variety without the teaching
  value of showing the API.
- **Bento** (one large + three mini charts) — breadth as a static poster,
  but cramped minis and the noisiest option.
- **Live** (single streaming area) — alive, but one chart type; the
  background wave now carries the "alive" signal with less noise.

## Consequences

- New components: `components/LandingCodeCard.vue`,
  `components/LandingBackground.vue`; `index.vue` keeps the Specimen chrome
  (ADR-0005) with the Code card in the hero slot.
- `shiki-magic-move` is a runtime dependency of the docs app.
- Along the way a library bug was fixed: `<Cell>` inside `<Pie>` was ignored
  (`pieSelectors.pickCells` returned an empty array); Pie now extracts cell
  props from its slot like Bar does, with a regression test.
