# Verification

The tooling has two kinds of commands:

- **Gates** prove a claim. Each one exits 0 or 1, runs in `pnpm verify` and CI, and has a proof that it can fail.
- **Instruments** (`pnpm lab <command>`) record what happens so you can debug it. They never decide a release.

`pnpm verify` runs the default tier and prints a verdict table (about 12 min on the maintainer's Mac; 18 min under heavy machine load, 2026-10-07). The latest results below come from one `VCCS_PORTS=4700-4709 pnpm verify --release --docs-browser=chromium,webkit` at 38abb40 (44 min, load average about 30). `pnpm verify --release` adds the slow browser gates; `pnpm verify --quick` skips the browser sweeps. Browser checks need a Chromium: `node scripts/lib/browser.mjs --install-browser`, or set `MOTION_EXECUTABLE_PATH` to an installed headless shell. `VCCS_PORTS=4620-4629` moves every check server into one port range. Evidence goes to `.evidence/` (git-ignored).

## Gates

Tiers: **quick** runs in every tier, **default** in `pnpm verify` and `--release`, **release** only in `--release` (and `release-check.yml`). CI (`test.yml`) runs the quick and default gates on every pull request, except the docs sweep.

"Can fail" names the proof. A test file is a committed self-test; "mutation" is a deliberate defect that was applied, made the gate exit 1, and was reverted (2026-10-07).

| Claim | Command | Tier | Threshold | Can fail | Latest result |
| --- | --- | --- | --- | --- | --- |
| Behaviour and public API stay intact; every fixed bug stays fixed | `pnpm --filter vccs exec vitest run` | quick | all pass | each bug fix has a regression test that fails without it | 2026-10-07 (38abb40): PASS, 146 files, 1506 tests, 120 s |
| The tooling verdicts and process helpers are right | `node --test scripts/check-verdicts.test.mjs scripts/check-process.test.mjs scripts/benchmark-*.test.mjs` | quick | all pass | the tests feed synthetic failing inputs | 2026-10-07 (38abb40): PASS, 4 s |
| Code style | `pnpm lint` | quick | 0 errors, 0 warnings | mutation: a `var` in a script | 2026-10-07 (38abb40): PASS, 32 s |
| Types | `pnpm typecheck` (vue-tsc, with the type probes) | quick | 0 errors | mutation: a string assigned to a number | 2026-10-07 (38abb40): PASS, 15 s |
| The library builds | `pnpm --filter vccs build` | quick | exit 0 | — | 2026-10-07 (38abb40): PASS, 15 s |
| A user's bundle stays small | `pnpm --filter vccs size` (budgets in `packages/vue/.size-limit.mjs`) | quick | every preset and chart under its gzip budget | mutation: Pie budget set to 1 kB | 2026-10-07 (38abb40): PASS, 2 s (single cartesian chart 45.7 kB of 48.2 kB) |
| The packed package resolves for consumers | `pnpm check:package` (publint, attw, export targets) | quick | all clean | mutation: an export pointing at a missing `.d.ts` | 2026-10-07 (38abb40): PASS, 14 s |
| Strict Vite and Nuxt consumers typecheck the packed package; each chart accepts only its own props; the Nuxt consumer's `nuxi dev` page renders bars with no page errors or hydration warnings (`--skip-dev`, used by `--quick`, skips this browser step) | `node scripts/check-consumers.mjs` | quick | 0 errors | it failed on d414ded (3 consumer failures from type drift); the dev step failed without the decimal.js-light pre-bundle in `vccs/nuxt` | 2026-10-07 (38abb40): PASS, 97 s (Nuxt dev page: 2 bars, 0 problems) |
| Production code stays small, typed and reachable | `pnpm check:code` | quick | 0 cycles and unused code; longest file ≤ 600 lines; ≤ 40 reasoned `any` disables; 0 `ts-ignore` | mutation: an unused export | 2026-10-07 (38abb40): PASS, 35 s (longest file 584 lines, 0 `any`, 0 `ts-ignore`) |
| The docs cover every public component | `node scripts/check-docs-coverage.mjs` | quick | every name in `componentNames.ts` has a docs heading or table row | it failed on d414ded (14 of 56 components missing) | 2026-10-07 (38abb40): PASS, 56 of 56 components |
| Standalone charts leave the cartesian engine out | `pnpm check:bundle --assert-standalone` | quick | 0 forbidden modules | mutation: AreaChart marked standalone | 2026-10-07 (38abb40): PASS, 5 s |
| Nuxt renders the charts on the server with stable HTML | `pnpm --filter vccs test:nuxt` | quick | the fixture's SVG and geometry assertions | mutation: one chart removed from the fixture page | 2026-10-07 (38abb40): PASS, 40 s |
| The motion guide shows the real motion tokens | `node scripts/update-motion-docs.mjs --check` | quick | the table matches `animation/motion.ts` | mutation: 0.5 s changed to 0.6 s in the guide | 2026-10-07 (38abb40): PASS, 1 s |
| The motion geometry flags fire | `node --test packages/vue/test/lab/report-metrics.test.mjs` | quick | all pass | the tests: a 40 px one-frame jump, a cut-off recording, a bar-list height snap, Web Animations on the real clock | 2026-10-07 (38abb40): PASS, 23 s |
| SSR, hydration, keyboard, contrast and axe pass for every chart | `pnpm check:a11y` | default | 0 serious or critical axe violations; contrast per fixture; no hydration warnings | mutation: near-white tick labels | 2026-10-07 (38abb40): PASS, 110 s |
| Production charts animate without recreated elements, warnings or long frames | `pnpm check:motion` | default | per scenario ≥ 42 frames in 800 ms, ≤ 1 frame over 34 ms, none over 50 ms; 0 recreated elements, warnings, page errors | mutation: a page error in the fixture | 2026-10-07 (38abb40): PASS, 73 s |
| The motion recorder records whole entrances and reports target-page errors | `node --test scripts/check-motion-report.test.mjs` | default | all pass | the tests: an error on the static target page must exit 1 | 2026-10-07 (38abb40): PASS, 20 s |
| Docs pages and demos render without errors | `pnpm check:docs` on the site from `pnpm --filter docs build` (`--docs-browser=chromium,webkit` selects engines) | default | 0 failed visits | `scripts/check-docs.test.mjs`: an empty chart page must fail | 2026-10-07 (38abb40): PASS with `--docs-browser=chromium,webkit`: 144 visits, 0 failed (docs build 145 s, check 335 s); the docs checker self-test (`scripts/check-docs.test.mjs`) PASS, 20 s. Firefox does not launch on this Mac |
| Every transition is smooth frame by frame: no jumps, reversals, stalls, overlaps, unsettled shapes, page errors | `node packages/vue/test/lab/report.mjs --prod --check` (fake clock, every frame, geometry only) | release | 0 flags except the accepted ones (decision D-25) | `report-metrics.test.mjs` and `check-motion-report.test.mjs` above | 2026-10-07 (38abb40): PASS, 285/285 transitions clean, 321 s |
| Playground pages load without hydration warnings, overflow, never-visible charts or unsettled motion; hover, legend and controls work | `pnpm check:play` | release | 0 product flags | `scripts/check-play.test.mjs` and the fixture with 14 deliberate defects | 2026-10-07 (38abb40): **FAIL** in the full sweep (1054 s, load average about 30): 21 of 22 page runs had 0 flags; `/area` at 1280 px had 4 "unsettled" flags, where the area entrance clip rectangle was still widening by about 0.5 px per frame at 2.5 s (0 px change in the area paths). The same route alone right after: PASS, 0 flags. The recorder self-test (`scripts/check-play.test.mjs`) PASS, 186 s. The previous release run (7c2b223) passed. See `internals/open-items.md` |

The geometry gate does not measure arc shapes (pie and donut sectors, radial bars, sunburst rings); review them with `pnpm lab film`. See `internals/open-items.md`.

## Instruments

| Question | Command | Output |
| --- | --- | --- |
| What does this transition look like, frame by frame? | `pnpm lab film <scenario…> [--steps=a,b]` | `.evidence/lab/film/<scenario>/`: 1× video, contact sheet and filmstrip PNG, `frames.json` (geometry per frame and the flags) per step |
| Does it drop frames on a real clock, also with the CPU slowed 4×? | `pnpm lab timing <scenario…>` | `.evidence/lab/timing/report.json` and `index.html` |
| Does a visitor see the entrance when scrolling to a chart or switching landing tabs? | `pnpm lab seen [route…]` | `.evidence/lab/seen/index.html`: visitor-viewpoint filmstrips, rAF data, verdict per chart (rows with real-clock gaps over 50 ms are "unreliable") |
| How does a scenario look by hand? | `pnpm lab dev` | the lab app on a Vite dev server (`?s=<scenario>`) |
| Is it faster or slower than vccs 0.6.0? | `pnpm bench`, `pnpm compare:upstream` | `.evidence/bench/`, `.evidence/upstream/summary.json` |

Every `pnpm lab` run lists its recordings (command, scenario or page, step, flags, files) in `.evidence/lab/manifest.json` and `.evidence/lab/index.html`. To debug an animation, see "Debug a motion bug" in [packages/vue/test/lab/README.md](packages/vue/test/lab/README.md).

Real-clock measurements depend on machine load; repeat them on a quiet machine before you trust a slow frame. Under heavy load (load average above ~30) a few unit tests can time out too.

## Not automated

- **The motion feels right** (timing, curves, choreography): review films from `pnpm lab film` and preview deploys. No script can judge taste.
- **Real devices** (touch, Safari on iOS, Firefox): the maintainer on preview deploys. Firefox does not launch on the maintainer's Mac, so `check:docs` covers Chromium and WebKit.
