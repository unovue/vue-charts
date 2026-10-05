# Review reports (2026-10-05)

Eight independent reviews of `feat/cell-grid-main` at `72c8765`, the basis of this plan. Line
numbers refer to that commit; the code moves during the run, so search for the named function or
pattern when a line no longer matches.

| File | Area | Reviewer |
| --- | --- | --- |
| [architecture.md](architecture.md) | internal architecture, store shape, removal plan, code quality | Opus |
| [api.md](api.md) | public API, consistency, TypeScript experience, breaking changes | Opus |
| [tests.md](tests.md) | test suite, weak tests, gaps, target test architecture | Opus |
| [motion.md](motion.md) | animation quality across all charts, motion lab | Opus |
| [performance.md](performance.md) | bundle size per chart, runtime, leaks, hotspots | Codex |
| [package.md](package.md) | published package, consumers, strictness, release mechanics | Codex |
| [ssr-a11y.md](ssr-a11y.md) | server rendering, hydration, accessibility, contrast | Codex |
| [bugs.md](bugs.md) | correctness bugs with failing reproductions | Codex |

Also here:
- `bugs/*.spec.tsx`: the reproduction specs of bugs.md. They were run from
  `packages/vue/src/__repro__/`; copy a case into the chart's own spec file when you fix it.
- `performance/*.mjs`: the benchmark and bundle scripts behind performance.md (starting point for
  `scripts/bench.mjs` and `scripts/check-bundle.mjs`). They contain paths of the original run.
- `ssr-a11y/*.mjs`: the SSR, hydration, axe and contrast scripts behind ssr-a11y.md (starting
  point for `scripts/check-a11y.mjs`).

Screenshots, JSON results and logs the reports mention lived in the git-ignored `.evidence/`
folder of the review machine and are not part of the repository.
