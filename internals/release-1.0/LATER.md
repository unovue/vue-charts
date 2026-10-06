# After 1.0: improvements we saw and froze

The 1.0 run keeps geometry and motion identical to the baseline and accepts flags that predate
it. This list collects what we saw along the way and deliberately did not fix inside a step.
Each item gets its own pass on top of the finished refactor. Evidence paths are under
`.evidence/release-1.0/` (git-ignored, local only).

Priority: **P1** user-visible bug · **P2** visible polish or reliability · **P3** code or tooling health.

## Product

- **P1 Unmeasured charts draw at the 640×360 server fallback, then jump.** 46 playground flags:
  when an unvisited chart scrolls into view, Line paths change width (616 → 315 px), Radar
  centres shift by exactly (640−250)/2 and (360−250)/2, Pie labels move 171–222 px. D-1 says
  responsive charts stay hidden until measured, so either the hiding fails for charts measured
  late or the recorder sees them through it. Six more flags: the same fallback shapes overflow
  their host on load (232–290 px). Evidence: `play-flags.md`, "SSR fallback" sections.
- **P2 Journey fold flags (9 accepted, D-25 / D-25c).** A re-ranked node folds backwards and
  briefly overlaps (top8: 7 px jump, 78 px² overlap; top15: two jumps, 83 px² overlap). The fold
  should split on the eased curve that neighbours use, not on time.
- **P2 Page startup blocks the first frames.** Visitor timing stays unreliable even run alone:
  BarList desktop shows a 120.8 ms gap with 55–95 ms startup long tasks. This is page startup
  cost, not only machine load (correcting the phase 1 note). Evidence: `seen-unreliable.md`,
  `seen-profile-findings.json`.
- **P3 Playground demos:** 33 presentational legends look clickable but do nothing; the
  dashboard Pie's centre total label sits inside the series group, so hover probes hit it
  (`dashboard-charts.vue:174`).

## Checks and tooling

- **P2 `check:play` exits 1 at baseline** (130 inherited flags); D-25d gates on "no new flags".
  Once the P1 above is fixed, return to a plain pass/fail with an explicit artifact list.
- **P2 `check:seen` cannot pass on this machine** (see the startup item above).
- **P3 The motion lab's rate comparison** does not reset pointer state between 1× and 4×, so
  4× looks faster than 1× (61–78 samples). Reset per rate or drop the comparison.
- **P3 The playground recorder hovers SVG centres** instead of data marks; 15 of 16 hover flags
  are artifacts of that.
- **P3 Firefox does not launch here**; docs ran on Chromium and WebKit only.
- **P3 Docs OG image:** the committed snapshot uses Unhead 3.4.2 despite the 2.1.12 override
  (`.evidence/seen/build-docs.log`).

## Code

- **P3 CalendarHeatmap parses dates twice** (`range` re-reads rows that `valuesByDay` already
  parsed, fix B3). Fold into one pass.
- **P3 Non-null assertions added for strict mode** (`pos.size!`, `cx!`/`cy!`, `dataKey!`) in
  code the model rewrite should replace; check that none survive 2.14.
- **P3 `motion.ts` imports the `Reveal` type from `useKeyedTransition.ts`**, which imports
  `motion.ts`. Type-only, but move `Reveal` next to the tokens.
- **P3 Run hygiene:** the `vue` commit scope in `a6ab90a` is outside the README's scope list.
