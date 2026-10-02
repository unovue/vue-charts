# ADR-0002: Docs design tokens — cube-motion.dev's system with a Vue-green accent

- Status: Accepted
- Date: 2026-10-01

## Context

The docs site's styling grew ad hoc: no semantic token layer, stagger values
described as "ad hoc" in the prototype baseline, and an unresolved role
conflict — orange served as both the UI accent and `chart-1` in demos.
A design exploration (`/proto/design-system`, since removed) compared five
token sets rendered through one shared specimen sheet, using real values
extracted from cube-motion.dev's own CSS.

## Decision

Adopt cube-motion.dev's design-token system 1:1, with the accent swapped to
Vue's brand green.

**Neutrals (zinc)**: `bg #fafafa` · `surface #ffffff` · `block #f4f4f5` ·
`border #e4e4e7` · text ramp `#18181b / #3f3f46 / #71717a / #a1a1aa`.

**Accent (Vue green)**: `#42b883` light / `#42d392` dark (same pairing as
vuejs.org). `accent-strong #2b7a56` (light) for small text on washes —
`#42b883` alone fails AA at small sizes. `accent-wash` 12%/14% alpha.

**Chrome ≠ data**: green is the UI accent (buttons, links, badges, focus
ring). The chart demo palette (`#f97316` etc.) is untouched — data colors
stay data colors.

**Shape**: card radius 24px, pad 10px, inner radius = 14px (outer − pad).
Pills 999px + `corner-shape: squircle` (progressive enhancement;
`border-radius` declared first as fallback).

**Elevation**: `--shadow-btn: 0 1px 2px rgba(0,0,0,.1), 0 2px 6px -2px
rgba(0,0,0,.12)`; `--shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 6px 16px -8px
rgba(0,0,0,.1)`. Ghost buttons use inset rings (`inset 0 0 0 1px border`),
never real borders. Dark mode collapses shadow stacks to 1px white rings.

**Type**: Inter 400–600 + JetBrains Mono 400–600. Scale: 15 body · 17 lede ·
14 UI · 13 sm · 12 mono-spec.

**Motion**: enter 640ms · stagger 70ms · exit 320ms (= ½ enter) ·
`cubic-bezier(.2,0,0,1)` · color transitions 160ms.

**Buttons**: cube's recipe — 32px high, 14px/500/-0.01em, `0 16px` padding,
ink-1 `#18181b` solid with hover to ink-2 `#3f3f46`. The 24×24 copy button
inside the install pill uses surface bg + ink-3 icon + inset ring. Visual
sizes stay compact like cube's; hit areas extend to ≥40px via `::before`.

**Dark mode**: derived by remapping the light scale (cube-motion ships
light-only, so dark values are ours, not cube's).

## Rejected directions (from the same exploration)

- **Current (baseline)** — no token layer; motion values ad hoc.
- **Cube Orange** — keeps the chrome-vs-data orange conflict.
- **Paper** (stone neutrals + Newsreader serif) — serif display sits oddly
  against code-dense API pages.
- **Graphite** (dark-first, dense, dual accent) — light mode becomes a
  second-class derivation; docs are read mostly in light.

## Consequences

- `docs/app/assets/main.css` owns the token layer (`--ds-*`); components
  consume tokens, not raw hex.
- Focus ring moves from orange (`--chart-1`) to `--ds-accent`.
- Nuxt UI `primary` maps to the Vue-green ramp; chart palette `--chart-*`
  remains orange-first for demos.
- Landing hero and docs page restyle are follow-up work consuming these
  tokens — this ADR fixes the foundation only.
