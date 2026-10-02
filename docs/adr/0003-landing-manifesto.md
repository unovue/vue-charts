# ADR-0003: Landing page direction — Manifesto (type-first), cube-style header

- Status: Superseded by ADR-0004 (direction reversed to Living)
- Date: 2026-10-01

## Context

With the token layer settled (ADR-0002), the landing page was redesigned
through a second prototype run (`/proto/landing`, since removed): three
directions sharing the same tokens, cube button recipe, and entrance motion,
each carrying an identical cube-style header so the hero was the only
variable.

## Decision

**Manifesto** — type-first. A two-line statement ("A chart is just
components, *composed.*") carries the hero; three real chart cards follow as
"proof", each with a mono spec caption and linking to its docs page.

**Header**: cube-motion's `.top` recipe — in-flow (not sticky), no bar, no
divider; wordmark left (16px logo + 600 wordmark), 13px/muted nav links and
a ghost GitHub button right, plus a theme toggle in the same icon-button
language. Nav links hide at ≤700px. This header is **scoped to the landing
page** (`layout: false`); docs pages keep the Docus chrome, which carries
search and mobile navigation.

**Removed**: the previous hero's living-chart background
(`HeroChartBackground.vue`), `DotGrid.vue`, and the evilcharts-style
showcase explorer — the category exploration they offered is served by the
docs sidebar and the proof cards' direct links.

## Rejected directions (from the same run)

- **Specimen** (left copy / right chart card + stat strip) — highest
  information efficiency, but reads as a near-copy of cube-motion's own
  landing; the brand would live in someone else's layout.
- **Living** (live streaming chart as hero background, content in a floating
  card) — the most memorable idea of the previous design, but the moving
  background costs legibility (needs a wash gradient) and low-end devices,
  and it competes with the headline for attention.

## Consequences

- `docs/app/pages/index.vue` is the Manifesto hero + proof row; entrance
  motion uses `--ds-enter` / `--ds-stagger` / `--ds-ease` and freezes under
  reduced motion.
- The landing's header component (`components/LandingHeader.vue`) is
  landing-only; a global header redesign would be a separate decision.
- Chart demo components under `app/charts/` are untouched — docs content
  pages embed them independently.
