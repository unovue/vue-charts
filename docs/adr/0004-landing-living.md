# ADR-0004: Landing direction revised — Living, fully token-conformant

- Status: Superseded by ADR-0005 (direction reversed to Specimen; the global
  `.ds-*` button classes introduced here remain in force)
- Date: 2026-10-01

## Context

ADR-0003 adopted the Manifesto landing. On review of the promoted page the
choice was reversed in favor of the run's second direction, **Living** — the
live streaming chart behind the hero was the previous design's most
memorable idea, and in direct comparison it won on brand distinctiveness.
The revision came with a conformance requirement: the prototype's background
chart and buttons predated the token layer and had to be rebuilt on it.

## Decision

Adopt **Living** as the landing direction:

- `HeroChartBackground.vue` rebuilt on the design system: series colors from
  the chart data palette (orange `#f97316` primary, neutral dashed
  secondary), axis-less (ambience, not a reading surface), streaming paused
  and data static under reduced motion.
- The cube button recipe is promoted from page-scoped copies to **global
  component classes in `main.css`** (`.ds-btn`, `.ds-btn-solid`,
  `.ds-btn-ghost`, `.ds-pill`, `.ds-copy`, `.ds-badge`). The landing, the
  design-system page, and `LandingHeader` all consume them — one source of
  truth instead of three transcriptions.
- Content panel, wash gradient, entrance motion (`--ds-enter` /
  `--ds-stagger` / `--ds-ease`) as prototyped; cube header scoped to the
  landing (`header: false`, `footer: false` page meta), docs pages keep the
  Docus chrome.

## Rejected

- **Manifesto** (ADR-0003's choice) — type-first is striking but pushes every
  chart below the fold; for a charting library the product should be visible
  immediately, and the live background delivers that with more personality.
- Keeping button styles page-scoped — three copies of the same recipe had
  already begun to drift; the global classes are the fix.

## Consequences

- New pages needing buttons use the global `.ds-*` classes; per-page copies
  of the recipe are a regression.
- `docs/app/pages/index.vue` is the Living hero; `design-system.vue` renders
  its button specimens from the same global classes it documents.
