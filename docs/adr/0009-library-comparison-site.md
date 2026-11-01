# ADR-0009: Library comparison as a separate site, built from `benchmark/` on main

- Status: Accepted
- Date: 2026-10-31

## Context

Issue #51 asks for a same-chart bundle benchmark and side-by-side pages against other Vue charting
libraries. Each card needs a competitor's packages at a pinned version. Installing them in the
workspace would put them in the root lockfile and the docs build, and the published numbers are
claims about other people's projects, so they have to be reproducible.

The first proposal was a dedicated Worker deployed from a long-lived benchmark branch, with verdicts
merged to main.

## Decision

**A folder on main, outside the pnpm workspace, with its own Worker.** `benchmark/` is installed with
`pnpm install --ignore-workspace`. A long-lived branch was rejected: it would drift from the library
it measures, and its results could not be reviewed in the same PR as the library change that moves
them. Later conclusions go to the docs as text with a link to the site.

**The displayed code is the measured code.** Each card is one SFC,
`site/src/charts/<chart>/<library>.vue`, taking `data` and `dark`. The site renders it, the Code tab
shows it, and the harness bundles it. Cards load client-only when they scroll into view.

**One isolated install per library.** `bundles/<library>/` holds a manifest and a lockfile, so a
library's dependencies cannot change another library's size.

**What counts as size.** First-load JavaScript and CSS only, gzip level 9, Vue external, from esbuild
with Vite as the cross-check. `vccs` is ranked with `motion-v` because it is a required peer; the
build without it is a reference row, as are Recharts and TanStack's defaults.

**The look is each library's default, and the chart's features are the same.** Every card has the
same data, three monotone lines where the library offers them, a tooltip, a crosshair and animation.
What a library cannot do in its free edition is left out and stated on its card with a source.
Every stage inherits the same 12px font. These rules are applied even where vccs does not win: at
this slice it ranks 5th of 9 and its default ticks drop a label.

**Claims are checked where they can be.** `pnpm compare:libraries` runs each build in Chromium and
fails it if it does not render, ignores hover or contradicts its animation claim, counted in pixels.
It writes `results/latest.json` only after a full passing run. `check-comparison` is the offline
gate that cards, pins, results and omission sources agree. Only the line chart is measured for size;
`pnpm compare:cards` browser-checks every card on every page of the built site.

## Consequences

- A library upgrade touches three places (site pin, bundle pin, results); the gate fails until they agree.
- Crosshairs are reviewed by eye, and source links are read by a person, not checked.
- Features and verdicts live with the data in `benchmark/features.mjs`, so the site and the docs page read one source. The docs page is built from these files, so it merges with them.
- Runtime performance is left out for now: load on the machine moved frame counts enough that timings need a quiet or dedicated runner to be credible.
- TanStack is measured with `svgAnimation` and its core `crosshair` mark. The issue named `motion()`
  and `focusGuideX`, but its docs list no `motion()` renderer or `/core` entry for the Vue `Chart`.
- Animation frames describe this setup, not a library's full ability: Unovis, TanStack and
  vue-data-ui animated updates but not the entrance here, and Vega-Lite's time encoding is unused.
- CI builds the site in the `docs` job; the slow browser checks stay instruments. Its Worker is named `vue-charts-benchmark`.
