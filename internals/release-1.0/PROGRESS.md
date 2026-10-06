# Progress

Statuses: `todo`, `done`, `deferred`. Evidence is ignored under `.evidence/`; unavailable checks are not passes.

## Steps

| Step | Title | Release-blocking | Dependencies | Status | Commits | Verification evidence and notes |
| --- | --- | --- | --- | --- | --- | --- |
| 0.1 | Environment and baseline verdict | yes | — | done | `c0c4d81`, `745da98`, `9e82e9b`, `a25538c` | Frozen install, Node 22 setup, locked/prefetched consumers and fresh network-denied typechecks/builds PASS. Step gate: current-config typecheck PASS; 126 files / 1,240 tests PASS with two workers; changed-file lint PASS with zero warnings. Full untouched-library baseline recorded below, including failed/unavailable checks. No library/model source changes. |
| 0.2 | Baseline build, benchmark and bundle scripts | yes | 0.1 | done | `a2554e2`, `7ae8462` | A/A18/18 within7.9%; CPU-control verified; size/standalone baseline and step gate recorded below. |
| 0.3 | Coverage that runs | yes | 0.1 | done | `b8ad56b`, `4ed7d5b` | 126 files/1,240 tests PASS; statements87.03%, branches75.63%, lines86.65%;272 source files, no tests/helpers/stories instrumented. |
| 1.1 | License notice | yes | phase 0 | done | `193d090`, `35d815e` | Packed LICENSE contains each notice exactly once; full MIT blocks;1,240 tests and typing PASS. |
| 1.2 | Stack ids that match Object members | yes | phase 0 | done | `afea98a` | Both accumulators prototype-safe;4 literal-height cases;reverse proof fails;1,244 tests/typecheck/build/lint PASS. |
| 1.3 | Tooltip `shared` reacts to changes | yes | phase 0 | done | `4bd43ca` | 126 files / 1,245 tests, typing and changed-file lint PASS; reverse proof fails as expected. |
| 1.4 | Funnel arrow keys never throw | yes | phase 0 | done | `a6e54f7` | 126 files / 1,246 tests, typing and changed-file lint PASS; reverse proof reproduces two TypeErrors. |
| 1.5 | Edge-data bugs | yes | phase 0 | done | `dba58d8`, `fa22eb5`, `8ece9ee`, `285bb44`, `fc53e5d` | Five separate bug commits; all reverse proofs fail as expected; 126 files / 1,254 tests, typing and changed-file lint PASS. |
| 1.6 | Keyboard for item charts | yes | 1.4 | done | `f8484c3`, `d245f27` | 127 files / 1,258 tests; typing and changed-file lint PASS. |
| 1.7 | Treemap, Sankey, SunburstChart: attributes, names, keyboard | yes | 1.6 | done | `f3528ef`, `43bb297` | 128 files / 1,261 tests; typing and changed-file lint PASS. |
| 1.8 | Reduced motion hydrates cleanly | yes | phase 0 | done | `5de7aba` | 129 files / 1,265 tests; typing and changed-file lint PASS. |
| 1.9 | Contrast, Legend and Brush semantics, and an a11y check | yes | 1.6–1.8 | done | `7176d44`, `916a00f` | 1,280 tests; 100 a11y cases; painted controls and zero-new-flags comparison PASS |
| 1.10 | BarList: height, index and per-frame cost | yes | phase 0 | done | `38e5e17` | Existing step evidence: 1,272 tests; browser height checks PASS |
| 1.11 | Engine: equal data, cascades, springs, events, one clock | yes | phase 0 | done | `a920bd6`, `e7daf33`, `dd12465`, `8a15c6c` | Existing step evidence: combined 1,280 tests; six reverse proofs |
| 1.12 | Motion tokens, shared cascade, moving labels | yes | 1.11 | done | `54ee9cf` | Existing step evidence: 1,280 tests; two reverse proofs |
| 1.13 | Lab: current curve, list height, accepted flags | yes | 1.10–1.12 | done | `660f4d8`, `456dab2` | 285/285 lab; 1,280 tests; 6 metrics tests |
| 1.14 | Docs facts from phase 1 | yes | 1.8, 1.12–1.13 | done | `bbde4b8`, `1995171` | 126/126 docs; 1,280 tests; 1 CLI regression |
| 2.0 | Strict typing and tests that survive the refactor | yes | phase 1 | done | `4f8b072`, `a6ab90a`, `51a8664` and this log commit | Strict typing, packed probe, public rewrites and gap cases pass; 1,275 tests; 285/285 motion transitions. |
| 2.1 | Slice 0: delete dead paths | yes | 2.0 | done | `315aed3` | 1,275 tests; typing, lint, motion and Brush parity PASS. |
| 2.2 | Slice 1: root inputs as getters | yes | 2.1 | done | `1f0aa71`, `b676450` | 1,273 tests; typing, lint, motion, packed consumers and SSR PASS. |
| 2.3 | Slice 2: registries | yes | 2.2 | done | `d933af2`, this log commit | Registry, unit, typing, lint, SSR and motion gates PASS; evidence below. |
| 2.4 | Slice 3a: layout math | yes | 2.3 | done | `49a7c42`, this log commit | Shared layout, step gate and 285/285 motion PASS; evidence below. |
| 2.5 | Slice 3b: axis model part 1 | yes | 2.4 | done | `efad585`, this log commit | Shared Cartesian axis models, step gate and 285/285 motion PASS; evidence below. |
| 2.6 | Slice 3c: axis model part 2 | yes | 2.5 | done | `2f271f0`, `dd5feaf` | 131 files / 1,283 tests; typing, lint and 285 motion transitions PASS. |
| 2.7 | Slice 3d: tooltip model | yes | 2.6 | done | `2c627f4`, this log | 132 files / 1,294 tests; typing, lint and 285 motion transitions PASS. |
| 2.8 | Slice 3e: cartesian series | yes | 2.7 | done | `b41413e`, this log commit | 132 files / 1,296 tests; typing, lint and 285 motion transitions PASS. |
| 2.9 | Slice 3f: polar series | yes | 2.8 | done | `a6b7c9d`, this log commit | 132 files / 1,296 tests; typing, lint and 285 motion transitions PASS. |
| 2.11 | Slice 5: standalone charts on TooltipSource and ChartShell | yes | 2.9 | done | `7300c14`, this log commit | Step gate, bundle assertion and 285 motion transitions PASS; evidence below. |
| 2.10 | Slice 4: delete the store shell | yes | 2.11 | done | 30bec72 | 131 files / 1,300 tests; motion 285/285 |
| 2.12 | Slice 6: context ownership | yes | 2.10 | done | ae90b23 | 131 files / 1,300 tests; motion 285/285 |
| 2.13 | Remaining architecture findings | assess | 2.12 | done | `005aa28`, `962f465`, `1b70eae`, `8874d7c`, `ac10672` | Completed step entry below; stale status row corrected. |
| 2.14 | Code health gates | yes | 2.13 | done | `4b885d0`, this log commit | Step gate and health proof PASS; Phase 2 verdict and counts below. |
| 3.1 | Recheck strict public declarations | yes | phase 2 | todo | | |
| 3.2 | Export surface | yes | phase 2 | todo | | |
| 3.3 | Internal props out of the public API | yes | phase 2 | todo | | |
| 3.4 | Chart prop sets and chart-level animation | yes | phase 2 | todo | | |
| 3.5 | Axis props | yes | phase 2 | todo | | |
| 3.6 | Active state and Brush range | yes | phase 2 | todo | | |
| 3.7 | Accessible names and the markup contract | yes | phase 2 | done | `a164398`, `0ed00b0` | D-15/D-22 gate PASS. |
| 3.8 | Series colors | yes | phase 2 | done | `ab9bfc6`, `8ee554d` | D-19 palette and contrast PASS. |
| 3.9 | Typed rows | yes | phase 2, 3.2, 3.4–3.6 | done | `9eb6655`, `a7915fb` | Typed rows, zero real any, numeric Bar slot and step gate PASS. |
| 3.10 | Renames, slots, events, deprecations | yes | phase 2, 3.2 | done | `f1e3264`, `f5c5cea` | Unit/type/lint/code PASS; corrected strict consumer probes PASS; packed rebuild not repeated. |
| 3.11 | Docs, playground and stories on the 1.0 API | yes | 3.1–3.10 | done | `6307828`, `ce80e4b`, `5f5840b`, this log commit | Fresh docs and isolated Line PASS; grep exceptions and raw gate failures recorded below. |
| 4.1 | Test surgery | assess | phase 2 | todo | | |
| 4.2 | Performance fixes | yes | phase 2, 1.11 | todo | | |
| 4.3 | Size budgets | yes | phase 3, 4.2 | todo | | |
| 4.4 | READMEs | yes | 3.11 | todo | | |
| 4.5 | Changelog | assess | 3.11 | todo | | |
| 4.6 | Release mechanics | yes | 1.9, 2.14, 4.3 | todo | | |
| 4.7 | Agent and maintainer docs | assess | phase 3, 4.6 | todo | | |
| 4.8 | Final verification list | yes | 4.1–4.7 | todo | | |
| 4.9 | Final report | yes | 4.8 | todo | | |

## Phase gates

| Phase | Date | `pnpm verify` | bench vs baseline | Other | Verdict |
| --- | --- | --- | --- | --- | --- |
| 0 | 2026-10-05 | Baseline FAIL retained (0.1) | A/A PASS; CPU control verified | 0.1–0.3 done; baseline metrics/report retained | PASS: setup/recording criteria; no claim of a green release verifier |
| 1 | 2026-10-06 | Prior full run FAIL; repaired checks below | Prior PASS: 21 rounds / 18 metrics | Playground comparison PASS; visitor capture completes | DEFERRED: visitor timing remains unreliable |
| 2 | | | | | |
| 3 | 2026-10-06 | FAIL retained; focused corrections below | FAIL retry: 17/18 metrics | Part B complete; numeric/a11y/docs/isolated play PASS | Complete with recorded gate failures; no all-green claim |
| 4 | | | | | |

## Step 0.1 evidence
- Commits: `c0c4d81`, `745da98`, `9e82e9b`, `a25538c`, `9e505eb`; source baseline `83dc1b0`, release checkout `fork_vue-charts-cellgrid-main`; original checkout preserved. Node22.23.3/pnpm9.15.0; frozen install, build and current-config typing PASS.
- Full baseline verify FAIL: initial unit 1,238/1,240; both isolated reruns PASS, full two-worker rerun 1,240/1,240 (74.63s). Lint PASS with 39 existing warnings; changed lint zero. Package PASS. [Log](../../../.evidence/release-1.0/baseline-verify-node22.log).
- Browser baseline: motion 283/285 clean (D-25 journey flags); playground 679 flags; docs 128 Chromium/WebKit visits, four BarList SVG-checker failures. Docs artifact provenance unverified; Firefox launch unavailable. Visitor-seen NOT RUN after fresh docs build failure.
- Locked Vite/Nuxt consumers: fresh offline frozen installs, strict typechecks and builds PASS under `sandbox-exec` network denial; `EPERM` positive control. [Evidence](../../../.evidence/release-1.0/consumers-offline.log).
- Lock SHA256: Vite `b11206344e3e79657aafa0f63d16e3b7b0a01adc48a76fcd5f7321ceeb44387e`; Nuxt `9e3e170ae41d511eb3526278c8449a0697df015a8c6cb76b5647c8ae2ce6702d`. Repack updates only local tar integrity; probe inside workspace was restored, successful probe uses external temp directory.
- Baseline dist preserved from original Node22-built tarball; raced incomplete copy replaced. Node24 attempt terminated/inconclusive. [Amendments](DECISIONS.md#amendments) cover paint order, model prop and painted visibility.
- Docs failure predates this run: committed OG-image snapshot uses Unhead3.4.2 despite existing2.1.12 override; installed graph agrees. Repair and fresh build pending1.14. [Build error](../../../.evidence/seen/build-docs.log).

## Step 0.2 evidence
- Added compact named-function runner, fixture injection flag, and 19-chart bundle checker. Baseline source `83dc1b0`; rebuild:266/266 runtime files byte-identical. No library runtime changes.
- A/A PASS:21 rounds,18/18 medians within7.9%, zero errors; 10%/±10% limits unchanged. [JSON](../../../.evidence/bench/2026-10-05T20-33-37.720Z-22593/results.json).
- Self-test PASS criterion: exit1, verified injection, zero errors,16/18 medians fail; one complete sampling round. [JSON](../../../.evidence/bench/2026-10-05T20-39-39.066Z-24777/results.json). No-motion control fails as intended.
- Step gate: current-config typing PASS;126 files/1,240 tests PASS (70.40s); build PASS; final changed-file lint PASS, zero warnings. [Logs](../../../.evidence/release-1.0/step-0.2-tests.log).
- Node22 bundle sizes PASS; standalone assertion expected FAIL for9/10 (BarList clean): retained axis/decimal/d3-time-format/reselect modules. [Compact sizes/medians](../../../.evidence/baseline/metrics.md); Node22.23.3/esbuild0.28.2/Playwright1.58.2/Chromium145.0.7632.6.
- Both builds regenerate each run: no cache/manifest. One page/CDP, shared peers; identical runtime source uses one canonical module, changed builds stay separate. Earlier noise/GC attempts inconclusive; GC removed. [Attempts](../../../.evidence/release-1.0/bench-noise.md).
- Limits: fixed900×400, equal warmups, rotated cases/alternating order; all values/fills/shapes checked, intermediate motion required. CPU/frame includes dispatch/layout/700ms idle tail, excludes GPU. Commits: `a2554e2`, `7ae8462`.

## Step 0.3 evidence
- `b8ad56b`: root coverage script targets vccs; exclude `**/__tests__/**` from instrumentation. No runtime/source behavior changed.
- `pnpm test:coverage --maxWorkers=2` PASS:126 files/1,240 tests,82.56s; statements87.03% (8,095/9,301), branches75.63% (5,387/7,122), lines86.65% (7,395/8,534). [Log](../../../.evidence/release-1.0/step-0.3-coverage.log).
- Report written;272 source files, zero test/helper/story entries. [Preserved baseline JSON](../../../.evidence/baseline/coverage-final.json). Current-config typing and targeted lint PASS with zero warnings; instrumented full suite supplies the unit gate.

## Step 1.1 evidence
- `193d090`: preserve Rick-hup's MIT notice and append D-29's full upstream notice. Packed root LICENSE contains one `2015-present recharts`, one `Rick-hup`, two full permission blocks; no duplicate library LICENSE needed. [Result](../../../.evidence/release-1.0/step-1.1-license.json).
- Node22 `pnpm --dir packages/vue pack --pack-destination ../../.evidence/pack` PASS. The plan's `--filter ... pack` command fails on pnpm9's unsupported recursive option; equivalent directory-scoped packing succeeds. Typing and126 files/1,240 tests PASS (75.04s); lint N/A (license text only).

## Step 1.2 evidence
- `afea98a`: null-prototype accumulators in axis grouping and bar sizing preserve existing string/numeric key grouping. Public table:constructor/__proto__/toString/a each render heights100/200.
- Initial test fails in axis grouping; fixing that alone fails in bar sizing. [D-27a amendment](DECISIONS.md#amendments) records the extra path before its fix. Reversing both fixes reproduces the crash; restored. [Reverse proof](../../../.evidence/release-1.0/step-1.2-reverse-proof.log).
- Gate PASS:126 files/1,244 tests (72.10s), current-config typing, build and changed-file lint0 warnings. Removed five obsolete `@ts-ignore` directives; typecheck passes without them. [Suite](../../../.evidence/release-1.0/step-1.2-tests.log).

## Step 1.3 evidence
- Retained the previous getter fix and public two-Bar regression; runtime `shared=false` shows one value instead of two.
- Reverse patch fails: expected `10`, received `10,20`; restored fix passes. [Proof](../../../.evidence/release-1.0/step-1.3-reverse.log).
- Gate PASS: 126 files / 1,245 tests (98.81s), typecheck, changed-file eslint zero warnings. [Suite](../../../.evidence/release-1.0/step-1.3-tests.log).
- Assumptions: two workers as in baseline; Node 22.18.0 available locally; slot text checks literal payload values and visible tooltip. No browser check required by this step.

## Step 1.4 evidence
- Guard missing or empty axis ticks before axis keyboard interaction; item navigation remains step 1.6.
- Public focus and ArrowRight / ArrowLeft / Home / End test checks window errors and console errors without suppressing either.
- Reverse patch reproduces two null-length TypeErrors; restored gate PASS: 126 files / 1,246 tests (79.64s), typecheck and changed-file lint zero warnings. [Proof](../../../.evidence/release-1.0/step-1.4-reverse.log), [suite](../../../.evidence/release-1.0/step-1.4-tests.log).
- Assumptions: no navigation behavior added ahead of 1.6; Node 22.18.0 and two workers as in 1.3.

## Step 1.5 evidence
- Commits: B3 `dba58d8`, B4 `fa22eb5`, B5 `8ece9ee`, B6 `285bb44`, S1 `fc53e5d`; one bug per commit.
- Public regressions cover missing calendar values, constant Sparkline paths, invalid journey counts and literal valid geometry, initial tooltip selection, and null / undefined / zero cohort periods.
- All five reverse patches fail on the original bug and are restored; ordinary constant data and undefined / zero cohort controls already pass before their fixes.
- Gate PASS: 126 files / 1,254 tests (64.81s), typecheck and all seven changed source/spec files lint with zero warnings.
- [Commands and results](../../../.evidence/release-1.0/slice-1.3-1.5-checks.md); full suite and per-bug proof logs are in `.evidence/release-1.0/`.
- Assumptions: validate journey counts before default step selection, preserving numeric coercion; selected Sparkline point watch follows data/geometry too. Node 22.18.0, two workers; no browser check named for this slice.

## Step 1.6 evidence
- Done: item keyboard order follows series registration then data; active shapes, tooltip and existing formatted announcements agree; Escape clears.
- Four public regressions PASS; reversing the source fix makes all four fail. [Proof](../../../.evidence/release-1.0/step-1.6-reverse.log).
- Gate PASS: 127 files / 1,258 tests (68.37s), typecheck, changed-file eslint zero warnings. [Suite](../../../.evidence/release-1.0/step-1.6-tests.log).
- Chromium keyboard PASS for Pie, Scatter and Funnel at 900px and 390px; visible tooltip / live region / 2px outline, zero page errors. [Results](../../../.evidence/release-1.0/keyboard-browser/before-1.7.json).
- Assumptions: keep existing tooltip label wording; identify equal-data-key series by their registered configuration; use Node 22.23.1 and two workers. Source: `f8484c3`.
- Final comparison: announcements now use the displayed tooltip label; reverse fails three item cases. Final slice gate: 1,265 tests, typing and lint PASS. [Proof](../../../.evidence/release-1.0/item-announcement-reverse.log). Follow-up: `d245f27`.

## Step 1.7 evidence
- Done: root attrs, D-15 titles/descriptions, D-14 spatial/pre-order navigation and Enter node-click; nested Treemap paths use source identity.
- Three public table cases PASS; source reverse makes all three fail. Removing the Sunburst totals read alone fails its parent tooltip case; restored. [Proofs](../../../.evidence/release-1.0/step-1.7-aggregate-reverse.log).
- Gate PASS: 128 files / 1,261 tests (70.56s), typecheck, changed-file eslint zero warnings. Correct combiner input types remove three obsolete suppression directives. [Suite](../../../.evidence/release-1.0/step-1.7-tests.log).
- Chromium before/after at 900px and 390px: six charts show tooltips/live text/outlines, zero page errors. [Final results](../../../.evidence/release-1.0/keyboard-browser/after-1.7.json); screenshots alongside.
- Surprise: parent Sunburst rows without value had no tooltip; canonical layout totals now supply it. A browser run overlapped the reverse proof; superseded and rerun against stable source.
- Assumptions: keep existing pointer indexes/event nodes; keyboard clicks carry KeyboardEvent (D-3 migration row added); fixed-size browser fixtures isolate keyboard behavior. Source commit: `f3528ef`; migration note: `43bb297`.

## Step 1.8 evidence
- Done: `5de7aba`; one mounted preference helper for all five production consumers; clocks wait for component mount, effect scopes keep immediate startup.
- Four hydration cases fail before the fix and with the source reversed; restored PASS. [Before](../../../.evidence/release-1.0/step-1.8-before.log), [reverse](../../../.evidence/release-1.0/step-1.8-final-reverse.log).
- Final gate PASS: 129 files / 1,265 tests (71.13s), typecheck, changed-file eslint zero warnings. [Suite](../../../.evidence/release-1.0/step-1.8-tests.log).
- Chromium Node SSR/hydration: 8/8 cases, zero warnings/errors; reduced cells have zero transitions. Final keyboard: 12/12 visible tooltips and matching live content, zero errors. [Checks](../../../.evidence/release-1.0/slice-1.6-1.8-checks.md).
- Earlier attempts had 11, 16 and 19 failures; fixed clock ordering and effect-scope startup without changing those tests. Vite optimizer 504 timeout was retained and a warmed rerun passed.
- Assumptions: detached effect scopes have no hydration phase; unit SSR disables matchMedia before client reduce; Node 22.23.1, two workers. Chromium only; no screen-reader certification.

## Step 1.9 evidence

- Done: `7176d44` retains contrast/semantics; `916a00f` completes D-25b painted visibility.
- Gate PASS: 129 files / 1,280 tests; typecheck and changed-file lint zero warnings; one recorder regression, reverse proof FAIL.
- A11y PASS: 100 cases / 780 samples, minimum 4.83:1; opaque/stroke controls positive, seven zero-paint cases ignored.
- Playground PASS under D-25d: HEAD/baseline each 130 real flags, zero new; raw exits 1, each 169 including 39 fixture flags.
- Evidence: [checks](../../../.evidence/release-1.0/gate-repair-checks.md), [baseline causes](../../../.evidence/release-1.0/play-flags.md).
- Assumptions: same corrected recorder on fresh `31da149`, local baseline library/dependencies; temporary worktree removed.

## Step 1.10 evidence
- Done: `38e5e17` carries occurrence indexes and displayed presence; height shares the row clock and frame indexing is linear.
- Gate PASS: 129 files / 1,272 tests (76.68 s), typecheck, build and changed-file eslint with zero warnings.
- Two regressions fail before / under the final reverse patch and pass restored. Heights: 212 → 194 → 176; empty 0; two rows 68.
- Interruption initially jumped 194 → 212; carried presence fixes it. Regression verifies 194 → 203 → 212 without a reset.
- Chromium 900 / 390px: 120 intermediate heights each, final 176; duplicate slot / click index 1; interrupted heights unchanged; zero page errors.
- Accessibility remains PASS: 100 cases / 780 samples, minimum 4.83:1. [Commands and evidence](../../../.evidence/release-1.0/step-1.10-checks.md).
- Assumptions: preserve sorted display indexes; bound presence to 0–1; reuse the motion clock. Linear work verified by source review; no CPU timing claim. Verification servers closed.

## Step 1.11 evidence
- Done: `a920bd6`, `e7daf33`, `dd12465`, `8a15c6c`.
- Equal copies, cascade turns, spring overshoot and one animation clock fixed.
- Snaps emit no callbacks; opacity and presence stay bounded; endpoints stay exact.
- Gate PASS: 129 files / 1,277 tests initially; final combined 1,280 tests (70.86 s).
- Typecheck, lint and build PASS; six regressions fail with their fixes reversed.
- Evidence: `.evidence/release-1.0/step-1.11-1.12-checks.md`; logs alongside.
- Assumptions: existing es-toolkit equality; Node 22.23.1, two workers.

## Step 1.12 evidence
- Done: `54ee9cf`; tokens, shared reveal and child labels preserve chart context.
- Gate PASS: 129 files / 1,280 tests; typing, lint on 18 files and build PASS.
- Two label reverse proofs fail as intended; restored PASS; tooltip timing is 150ms.
- Chromium 900/390px: Thu 110 → ≈92.336 → 91.5; 12/12 months retained; zero errors.
- Full lab: 280/285, exit 1; corrected Sankey recheck 12/12. Journey extras match baseline (D-25c).
- Evidence: `.evidence/release-1.0/step-1.11-1.12-checks.md`; reports linked there.
- Assumptions: domain and YYYY-MM keys; initial labels unchanged; acceptance unchanged.

## Step 1.13 evidence
- Done: `660f4d8`; source tokens, container height and strict acceptance gate.
- True baseline `31da149` and HEAD match: nine Journey flags; D-25c accepts five identities.
- Gate PASS: 129 files / 1,280 tests; typecheck and lint with zero warnings; six metrics tests.
- Production lab PASS: 285/285 transitions; zero errors or stale entries; 570 video links valid.
- Reverse height proof: four browser snaps; detector test fails reversed and passes restored.
- Evidence: `.evidence/release-1.0/step-1.13-checks.md`; baseline worktree removed.
- Anomaly: 78 throttled worst intervals are smaller; largest 33.2 → 10.4 ms. No speed conclusion.
- Assumptions: Node 22 source imports; focused staleness; existing overlap identity; absolute output.

## Step 1.14 evidence
- Done: `bbde4b8`; generated timing table, riding labels, D-1 SSR facts and D-30 prefix note.
- Guide headings unchanged; rendered text and final guide screenshots reviewed.
- Gate PASS: 129 files / 1,280 tests; typecheck and lint with zero warnings; timing table check.
- Docs PASS: 126 visits; zero failures or engine errors in Chromium/WebKit. Firefox cannot launch.
- Native BarList checker regression: one test passes; fails under its reverse patch; restored PASS.
- Existing Unhead override repaired in one lock entry; offline install reused cache, zero downloads.
- Evidence: `.evidence/release-1.0/step-1.14-checks.md`; initial eight docs failures retained there.
- Assumptions: normal docs build; Node 22; `verify --docs-browser=chromium,webkit`; thresholds unchanged.

## Visitor checker repair

- Done: `c79cfcb` streams capture; `5f48f6c` resets paused captures from live charts; verifier runs all three recorder regressions.
- Gate PASS: 129 files / 1,280 tests; typecheck/lint zero warnings; two visitor regressions PASS, both reverse proofs FAIL.
- Full summary: 322 rows / 4 flags / 135 unreliable / 0 errors. Isolated 63/63: 299 rows / 8 flags / 130 unreliable / 0 errors.
- Fixture PASS: six reliable rows, five expected flags; ten real landing tab clicks PASS at both widths. Phase 1 remains deferred.
- Evidence: [checks](../../../.evidence/release-1.0/gate-repair-checks.md), [row explanations](../../../.evidence/release-1.0/seen-unreliable.md).
- Assumptions: four-frame transfers, one snapshot per transfer; raw data preserved, exact geometry shared only for analysis; thresholds unchanged.

## Phase 1 gate evidence

| Check | Verdict | Observed result |
| --- | --- | --- |
| Typecheck | PASS | Current Node 22 run; zero diagnostics |
| Unit and recorder regressions | PASS | 129 files / 1,280 tests; three recorder tests; reverse proofs fail |
| Root lint | PASS, retained | Prior full lint: 27 existing warnings; current changed-file lint: zero warnings |
| Library build | PASS | Fresh full visitor and accessibility builds complete |
| Package exports and types | PASS, retained | 589 files / three exports; strict publint and attw |
| Accessibility, contrast and hydration | PASS | Fresh 100 cases / 780 samples; minimum contrast 4.83 |
| Production motion lab | PASS, retained | 285/285 transitions; nine accepted baseline Journey flags |
| Playground browser sweep | PASS, D-25d | HEAD and fresh `31da149`: 130 real flags each; zero new scenario/kind/element flags; both raw exits 1 |
| Docs in Chromium and WebKit | PASS, retained | 126 visits; zero failures or engine errors |
| Docs checker regression | PASS, retained | One public CLI regression |
| Visitor-seen entrances | FAIL | Full: 322 rows, 4 flagged, 135 unreliable, 0 errors. Isolated: 299 rows, 8 flagged, 130 unreliable, 0 errors |
| Benchmark vs baseline | PASS, retained | 21 rounds / 18 metrics; zero errors; B/A 0.901–1.052 |

- DEFERRED: full sweep, 63 isolated reruns and startup profiling retain timing failures. All flags are unreliable; no product-regression conclusion or threshold exception.
- [Current commands and proofs](../../../.evidence/release-1.0/gate-repair-checks.md), [playground comparison](../../../.evidence/release-1.0/play-comparison.md), [visitor explanations](../../../.evidence/release-1.0/seen-unreliable.md).
- Assumption: retain unchanged product/package/docs/lab/benchmark results from `23dacb7`; [source diff is empty](../../../.evidence/release-1.0/unchanged-product.json). Full `pnpm verify` and benchmark were not rerun; prior Firefox launch limit remains.
- Anomalies: one playground allocation ID differs but movement/role match; visitor flags vary 4 → 8. Initial row-order matching falsely resolved two charts; physical matching confirms five resolved and 130 still unreliable.
- [Prior failed verifier and timing anomalies](../../../.evidence/release-1.0/phase-1-checks.md), [prior verdict snapshot](../../../.evidence/release-1.0/phase-1-progress-before-repair.md). Completed fixes are retained; no partial product changes require reverting.

## Phase 1 decision (orchestrator)
- Phase 1 is accepted. Visitor timing (`check:seen`) is environment-limited, like D-25a: it never ran at baseline, its unreliable rows trace to machine load (load average 12–13 during the run), and the capture now completes with 0 errors.
- It must pass on an idle machine in the step 4.8 final verify. The 130 inherited playground flags are listed in play-flags.md and are reviewed in 4.2.

## Step 2.0 evidence

- Gate PASS: strict typing; 131 files / 1,275 tests; lint on 72 changed files, zero warnings.
- Packed Vite/Nuxt and nullability PASS; both reverse proofs fail as expected, restored checks PASS.
- Motion PASS: 285/285, nine accepted flags, zero errors; resize recheck 3/3; three frames match baseline pixels.
- Evidence: `.evidence/release-1.0/step-2.0/`. Assumptions: reuse installed types and panorama test; no adapter.

## Step 2.1 evidence
- Done: `315aed3`; delete panorama plumbing, dead files/state and listed dead exports.
- Gate PASS: 131 files / 1,275 tests; typecheck; lint on 44 changed files, zero warnings.
- Motion PASS: 285/285 transitions, nine unchanged accepted flags, zero errors; 570 videos exist.
- Brush PASS: two viewport cases, range 10–30 → 14–34; three settled frames match step 2.0 pixels.
- Evidence: `.evidence/release-1.0/step-2.1/`; verification server closed.
- Anomalies: resize/narrow curves 0 → 6; 109 throttled intervals faster; suite 73.57 → 97.54 s. No performance conclusion.
- Assumptions: Node 22.23.3, two workers; retain locally used calculations as private; fixed-size Brush fixture.

## Step 2.2 evidence
- Done: `1f0aa71`, `b676450`; chart model/getters, shared defaults, one tracked selector adapter, SSR fixture correction.
- Gate PASS: 129 files / 1,273 tests; typecheck; lint on 19 changed files, zero warnings.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors; four pixel samples and all 57 numeric Area frames match.
- Data contracts, margin/range, reverse proofs, fresh packed Vite/Nuxt and SSR entrance/completed geometry PASS.
- Evidence: `.evidence/release-1.0/step-2.2/`; all verification servers stopped.
- Anomalies: 99 throttled intervals faster; suite 97.54 → 230.48 s; Area video differs by 50,334 pixels; stale SSR expectation corrected.
- Assumptions: component EffectScope, compact defaults, standalone fallback in the single adapter; item animation mode in SSR fixture; Node 22, two workers.

## Step 2.3 evidence
- Done: `d933af2`; computed registrations retain setup order and dispose with component scopes.
- Gate PASS: strict typing; 130 files / 1,274 tests; lint on 35 changed files, zero warnings; build PASS.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; no curve-count differences.
- Public regressions and reverse proofs PASS; Nuxt SSR 1/1 and four baseline HTML comparisons PASS.
- Evidence: `.evidence/release-1.0/step-2.3/`; Bar 57/57 numeric frames match; verification servers closed.
- Anomalies: Area auxiliary frames, decoded pixels and timing vary; details in `checks.md`. No conclusion.
- Assumptions: Node 22, two workers, local YAxis measurements; retain type files and the single tracked adapter.

## Step 2.4 evidence
- Done: `49a7c42`; chart-scoped layout refs and pure core math; obsolete forwarding paths removed.
- Gate PASS: strict typing; 130 files / 1,274 tests; lint on 11 files, zero warnings.
- Motion PASS: 285/285 transitions, nine unchanged accepted flags, zero errors; 570 videos.
- Geometry PASS: all 114 Bar/Area numeric frames match step 2.3; Bar images inspected.
- Evidence: `.evidence/release-1.0/step-2.4/`; anomalies: suite 126.57 → 212.51 → 122.74 s; 92 throttled intervals faster.
- Assumptions: Node 22, two workers; retain Brush/Legend interaction owners and the single adapter fallback.

## Step 2.5 evidence
- Done: `efad585`; cached Cartesian axis models own settings, data, domains and stacks; pure math in core.
- Gate PASS: strict typing; 131 files / 1,281 tests; lint on 26 files, zero warnings; build PASS.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; no curve-count changes.
- SSR PASS: 1/1 test, four byte-identical HTML comparisons; Bar 57/57 frames match; servers closed.
- Evidence: `.evidence/release-1.0/step-2.5/`; anomalies: Area 56/57 frames differ, max 0.733 px; 105 throttled intervals faster.
- Assumptions: Node 22, two workers; polar/scales/ticks in 2.6; retain strict IDs and the single tracked adapter.

## Area auxiliary comparison resolved
- Production lab builds of `9b7130d`, `2a2ff0a` and `4d36cf3`: all 114 Area/stacked-Area frames match exactly after the same complete entrance wait.
- The auxiliary sampler excludes clip paths; three unchanged shape snapshots can falsely report a sweeping Area as settled.
- Its next action interrupts that unfinished entrance; even one extra metadata read changes the same registry build in 56/57 frames; this capture mixes in unfinished entrance scheduling.
- No steady-state geometry regression: `.evidence/release-1.0/area-investigation/settled-comparison.json`; raw captures and screenshots retained alongside.

## Step 2.6: axis scales, ticks and polar geometry
- Done: `2f271f0`, `dd5feaf`; axis verification recorded. Removed axis/polar selectors; one tracked adapter remains.
- Gate PASS: Node 22, 131 files / 1,283 tests (107.10 s), typecheck, build and 52 changed-file lint checks, zero warnings.
- Public duplicate-ID regression: 6/6 pass; reverse patch fails both placement cases (45 expected, 65 received).
- Motion PASS: 285/285, nine unchanged accepted flags, zero browser errors, 570 videos.
- Area: 114/114 frames match pre-2.3 exactly; SSR: 1/1 test and four byte-identical sections.
- Evidence: `.evidence/release-1.0/step-2.6/checks.md`; resize narrow curves 6 → 0, focused repeat 6; 103 throttled intervals faster; no conclusion.
- Assumptions: Node 22, two workers, six immutable source snapshots; preserve last duplicate-axis registration and the single adapter.

## Step 2.7: tooltip model and TooltipSource
- Done: `2c627f4`; this log commit records verification. One chart controller and read-only TooltipSource; one adapter remains.
- Gate PASS: 132 files / 1,294 tests (103.64 s), typecheck, build, lint on 39 changed files with zero warnings.
- Public regressions cover ownership, control, identity, hierarchy and sync; all twelve reverse patches fail as expected.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; curve counts match step 2.6.
- Area: 114/114 frames match pre-2.3; SSR: 1/1 and four byte-identical sections; Chromium 900/390px PASS, servers closed.
- Evidence: `.evidence/release-1.0/step-2.7/checks.md`; resize differs from 2.5; 120 throttled intervals faster; no conclusion.
- Assumptions: Node 22, two workers, six frozen snapshots; preserve legacy callback strings and private pointer-only link handles.

## Step 2.8: Cartesian series geometry
- Done: `b41413e`; item computeds read shared axes, pure series/sizing math lives in core; one tracked adapter remains.
- Gate PASS: 132 files / 1,296 tests (85.88 s), typecheck, build, 37-file lint with zero warnings; two reverse proofs fail.
- Motion PASS: 285/285 transitions, nine unchanged accepted flags, zero errors, 570 videos; curve counts unchanged.
- Geometry PASS: 285 Cartesian and 114 Area frames match exactly; evidence: `.evidence/release-1.0/step-2.8/checks.md`.
- Anomalies: 115 throttled intervals faster; 22 raw captures / 1,088 frames differ, mainly entrances; no conclusion.
- Assumptions: Node 22, two workers, six frozen fixtures; keep inline Funnel/ErrorBar computeds and utility re-exports; servers closed.

## Step 2.9: polar series geometry
- Done: `a6b7c9d`; Pie, Radar and RadialBar use setup computeds and pure core geometry; Bar sizing math is shared.
- Gate PASS: 132 files / 1,296 tests (88.96 s), typecheck, build and 14-file lint with zero warnings.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; final curve counts unchanged.
- Geometry PASS: 456 exact polar frames at verified 720/360px widths; corrected narrow sampler, servers closed.
- Evidence: `.evidence/release-1.0/step-2.9/checks.md`; raw 20 captures / 1,031 frames differ; 70 throttled intervals faster; no conclusion.
- Assumptions: Node 22, two workers, six frozen fixtures; preserve tick semantics and public payload types; one tracked adapter remains.

## Step 2.11: standalone charts on TooltipSource and ChartShell
- Done: `7300c14`; nine roots share lightweight selection and shell; Treemap/Sankey forwarders removed; one adapter remains.
- Gate PASS: 132 files / 1,301 tests (148.17 s), typecheck, build and lint on 30 files with zero warnings; bundle assertion PASS.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; refill regression reverse proof fails as expected.
- Geometry: 513 exact settled frames per width; narrow Journey differs only in 84 faint markers across two frames; servers closed.
- Evidence and gzip: `.evidence/release-1.0/step-2.11/checks.md`; anomalies: 23 raw captures / 1,089 frames, resize 0 → 6, 105 faster throttled intervals.
- Assumptions: Node 22, two workers, six frozen sources; preserve legacy viewport and surface-scope geometry lifetime; Chromium only.

## BarList bundle repair after 2.11
- Done: `9e3e21a`; props-only import removes CellGridLayer, tooltip and d3-color from BarList.
- Bundle PASS: 13,709 → 7,410 gzip bytes; baseline 8,947; baseline cap rejects the reverse patch.
- Gate: typecheck/build/lint PASS; full 1,300/1,301, isolated transition file finally 21/21; public BarList/Sparkline 16/16.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; curves unchanged.
- Evidence: `.evidence/release-1.0/barlist/checks.md`; servers closed, six source copies identical.
- Anomalies: planning 2,187ms exceeded 1,500ms; separate 5s timeout; 23 raw captures/1,198 frames differ; 67 faster throttled intervals.
- Assumptions: retain prop defaults, enforce the existing baseline under standalone assertion; established Node 22/two-worker gate.

## Step 2.10: delete the store shell
- Done: `30bec72`; src/state, selector facade, reselect and tracked adapter removed; computed Brush/Legend bindings, pure core boundary.
- Gate PASS: 131 files / 1,300 tests (142.12 s), typecheck/build, 126-file lint; obsolete private identity test removed.
- Package/bundle/SSR PASS: 554 tarball files, three exports, zero reselect bytes; BarList 7,410 gzip; Nuxt 1/1.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; curve counts unchanged.
- Geometry PASS: 2,736 exact settled frames across 720/360px; evidence `.evidence/release-1.0/step-2.10/checks.md`.
- Anomalies: 26 raw captures / 1,262 frames differ, 22 entrances; 100 faster throttled intervals; no conclusion, servers closed.
- Assumptions: preserve public types and existing Brush range contract; canonical computed owners; two workers, six frozen fixtures, Chromium only.

## Step 2.12: context ownership
- Done: `ae90b23`; lightweight ChartRuntime and typed keys own contexts; factories/forwarders gone; motion types from motion-v.
- Gate PASS: 131 files / 1,300 tests (131.31 s), typecheck/build and 47-file lint with zero warnings.
- Package/bundle/SSR PASS: 540 files, three exports, zero reselect bytes; BarList 7,414 gzip below 8,947; Nuxt 1/1, public fallback proof PASS.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; resize/narrow curves 6 → 0, others unchanged.
- Geometry PASS: 2,736 exact settled frames at 720/360px; evidence `.evidence/release-1.0/step-2.12/checks.md`.
- Anomalies: 23 raw captures / 1,095 frames differ, 19 entrances; 96 faster throttled intervals; no conclusion, servers closed.
- Assumptions: retain scoped keys and public ErrorBar fallback signatures; direct private-path cutover; two workers, six frozen fixtures, Chromium only.

## Step 2.13: remaining architecture findings and elegance
- Done: `005aa28`, `962f465`, `1b70eae`, `8874d7c`, this commit; ownership, modules, names, native defaults and VueUse cleanup complete.
- Gate PASS: 130 files / 1,302 tests with README timeout retry (64/64); typecheck, build and 109-file lint with zero warnings.
- Motion PASS: 285/285, nine unchanged accepted flags, zero errors, 570 videos; curve counts unchanged; geometry 2,736 exact frames.
- Package/bundle/SSR PASS: 545 files, three exports, zero runtime cycles/reselect; BarList 7,652 gzip below 8,947; Nuxt 1/1.
- Hydration fallback: uniform gate changed barMany curves 0 → 182 and off-screen shapes 0 → 2, beyond the permitted one-frame offset.
- Original gate retained; public auto-width hydration regression reverse-proved. Evidence `.evidence/release-1.0/step-2.13/checks.md`; servers closed.
- Anomalies: 22 raw captures / 983 frames / 18 entrances differ; 84 faster throttled intervals; timeout 36.79s; BarList +238 bytes; no conclusion.
- Assumptions: native defaults now (3.4 not run), preserve ID equivalence and public geometry; Node 22, two workers, six frozen sources, Chromium only.

## Step 2.14: code health gates
- Done: `4b885d0`, this log commit; dead code removed, typed boundaries simplified, health gates added locally to PR workflow.
- Step gate PASS: typecheck, 130 files / 1,302 tests, changed-file lint with zero warnings; tests and lockfile unchanged.
- Code PASS: zero cycles/unused findings, strict typing, longest 547 lines, three reasoned any disables, zero ts-ignore; temporary cycle rejected.
- Motion PASS: 285/285 transitions, nine unchanged accepted flags, zero browser errors, 570 videos; resize curves 0 → 6 remains an anomaly.
- Phase 2 verdict and before/after counts are below; no adapter added; `internals/migrations.md` remains empty.
- Evidence: `.evidence/release-1.0/step-2.14/checks.md`; source commit and final reports preserved; verification servers closed.
- Assumptions: existing two-worker gate; Chromium/WebKit docs subset; preserve public heterogeneous callback types with three reasoned boundaries.
- Anomalies: one playground recorder timeout cleared in isolation; baseline benchmark sample failed then retry passed; 70 faster throttled intervals, no conclusion.

## Phase 2 gate after step 2.14

Completed with the two exceptions explicitly accepted in the brief and `LATER.md`. The full verifier exits 1; every other check passes. The full playground sweep has 58 known flags plus one recorder timeout, which did not recur in the isolated route retry. This exception is recorded, not suppressed.

| Check (exact command; Node 22 PATH prefix used throughout) | Verdict | Final result and evidence |
| --- | --- | --- |
| `pnpm --filter vccs typecheck` | PASS | Exit 0; `step-2.14/typecheck.log`. |
| `pnpm --filter vccs exec vitest run --maxWorkers=2` | PASS | 130 files / 1,302 tests; `step-2.14/verify-final.log`. |
| `pnpm exec eslint .` | PASS | Exit 0; `step-2.14/verify-final.log`. |
| Changed-file `pnpm exec eslint … --max-warnings 0` | PASS | Exit 0, zero warnings; exact command in `step-2.14/checks.md`. |
| `pnpm check:code` | PASS | Zero cycles/unused, 547-line maximum, three reasoned disables; `step-2.14/code-final.json`. |
| Temporary-cycle `pnpm check:code` | PASS (negative proof) | Exit 1, one cycle and two unused files detected; temporary files removed; `step-2.14/cycle-proof-final.json`. |
| `pnpm --filter vccs build` | PASS | Exit 0; `step-2.14/verify-final.log`. |
| `pnpm check:package` | PASS | 540 packed files, three exports/declarations; `step-2.14/verify-final.log`. |
| `pnpm check:a11y` | PASS | 100 cases; `step-2.14/verify-final.log`. |
| `pnpm motion:report --prod --check` | PASS | 285/285 transitions, nine accepted flags, 570 videos, zero browser errors; `.evidence/motion-report/report.json`. |
| `pnpm check:play` | known, LATER.md | Exit 1; 22 visits, 209 recordings, 58 known flags (46 teleports, six overflow, six tooltip) plus one execution timeout; `step-2.14/play-final.json`. |
| `pnpm check:play --skip-build --route=/line-charts --out=.evidence/release-1.0/step-2.14/play-line-retry` | known, LATER.md | Exit 1; two visits, 26 known flags, zero execution flags; timeout absent; `step-2.14/play-line-retry/results.json`. |
| `node --test scripts/check-play.test.mjs` | PASS | Two tests; `step-2.14/verify-final.log`. |
| `pnpm check:docs --browser=chromium,webkit` | PASS | 126 visits, zero failed/engine errors; `step-2.14/docs-final.json`. |
| `node --test scripts/check-docs.test.mjs` | PASS | One test; `step-2.14/verify-final.log`. |
| `pnpm check:seen` | known, LATER.md | Exit 1; 322 rows, 11 flagged, 134 unreliable, zero errors; `step-2.14/seen-final.json`. |
| `node --test scripts/check-seen.test.mjs` | PASS | Two tests; `step-2.14/verify-final.log`. |
| `pnpm bench --compare=.evidence/baseline/dist` | PASS (retry) | Exit 0; 21 interleaved rounds, 18/18 metrics; `step-2.14/bench-final.json`. |
| `pnpm check:bundle --assert-standalone` | PASS | Exit 0; 19 bundles, zero forbidden standalone modules, BarList 7,652 gzip bytes; `step-2.14/bundle-final.json`. |

All `step-2.14/` evidence paths above are under `.evidence/release-1.0/`. Firefox was not run because its documented launch failure remains. The local workflow was edited and committed; no remote CI run or push was performed.

### Before/after counts

Source: `.evidence/release-1.0/step-2.14/counts.json`. Production `.ts/.tsx/.vue` excludes tests, stories, storybook and fixtures. Lines are physical lines; `watch(` and whole-word `any` are text counts including comments. The 25 final `any` matches are not 25 explicit-any types. Historical test counts come from the named PROGRESS entries; the final count comes from `verify-final.log`.

| Metric | Run baseline `83dc1b0` | Phase 2 start `1995171` | Before 2.14 `ac10672` | After `4b885d0` |
| --- | ---: | ---: | ---: | ---: |
| Production files | 318 | 321 | 301 | 296 |
| Production lines | 32,869 | 33,325 | 28,849 | 28,437 |
| `watch(` | 58 | 57 | 36 | 36 |
| `any` text matches | 478 | 477 | 362 | 25 |
| Tests | 1,240 | 1,280 | 1,302 | 1,302 |

### Benchmark medians and spread

Source: `.evidence/release-1.0/step-2.14/benchmark-spread.json`, derived from the final `bench-final.json`. A is the saved run baseline; B is the current build. These are equal-work, interleaved samples in the same browser. Ranges are the minimum–maximum of the 21 samples per side. Static units are ms; animated units are CPU ms/frame. No timing comparison is made with earlier runs under different load.

| Case | Metric | A median (range) | B median (range) | B/A |
| --- | --- | ---: | ---: | ---: |
| LineChart 100 | mountMs | 13.00 (11.00–18.60) | 12.20 (9.90–15.50) | 0.938 |
| LineChart 100 | updateMs | 3.60 (3.10–5.00) | 3.60 (3.00–4.20) | 1.000 |
| LineChart 1000 | mountMs | 43.70 (37.10–54.20) | 44.80 (37.90–54.80) | 1.025 |
| LineChart 1000 | updateMs | 18.20 (15.80–28.90) | 17.50 (15.00–25.60) | 0.962 |
| LineChart 10000 | mountMs | 409.00 (363.80–487.20) | 405.50 (357.30–777.40) | 0.991 |
| LineChart 10000 | updateMs | 182.40 (158.70–263.90) | 187.90 (163.60–269.70) | 1.030 |
| BarChart 100 | mountMs | 11.00 (9.50–19.80) | 10.20 (8.20–13.50) | 0.927 |
| BarChart 100 | updateMs | 3.30 (2.80–3.90) | 3.00 (2.50–3.50) | 0.909 |
| BarChart 1000 | mountMs | 31.50 (27.20–37.60) | 31.80 (26.70–37.90) | 1.010 |
| BarChart 1000 | updateMs | 13.00 (11.50–18.30) | 12.70 (10.80–87.80) | 0.977 |
| BarChart 10000 | mountMs | 260.60 (226.70–353.10) | 261.30 (229.40–364.60) | 1.003 |
| BarChart 10000 | updateMs | 114.20 (104.80–169.90) | 118.20 (102.50–148.50) | 1.035 |
| Heatmap 168 | mountMs | 5.50 (5.00–9.10) | 5.80 (4.90–12.90) | 1.055 |
| Heatmap 168 | updateMs | 3.30 (2.70–5.30) | 3.50 (2.90–7.70) | 1.061 |
| CalendarHeatmap 365 | mountMs | 21.70 (18.80–25.80) | 23.30 (19.70–45.90) | 1.074 |
| CalendarHeatmap 365 | updateMs | 18.90 (16.50–21.10) | 19.30 (17.30–23.90) | 1.021 |
| LineChart 1000 | cpuMsPerFrame | 9.22 (7.81–10.98) | 8.72 (7.64–12.96) | 0.945 |
| BarChart 1000 | cpuMsPerFrame | 6.15 (5.57–6.90) | 5.81 (5.13–8.83) | 0.944 |

### Recorded anomalies

- Motion comparison (`step-2.14/motion-comparison.json`): resize/narrow curve count is 0 → 6 against step 2.13; other curve counts and issue sets match. Native resize/paint timing is a plausible cause, with low confidence; historical resize captures also alternated. Geometry equality is not certified by this comparison; no conclusion is drawn.
- The same report contains 70 intervals where throttled worst-frame time is lower than unthrottled. Cadence and machine load may explain this; timings were not compared with the concurrent predecessor and no performance conclusion is drawn.
- Full playground report has one 15,500 ms recorder timeout beyond the accepted 58 flags. The isolated line-route retry completes both visits without that timeout; likely a transient capture stall, with moderate confidence. The full report remains unchanged.
- First benchmark attempt (`step-2.14/bench.log`, `.evidence/bench/2026-10-06T13-28-00.698Z-75755/results.json`) stopped before a verdict because saved-baseline LineChart lacked an intermediate animation sample. The unchanged full retry passes; sampling/load is plausible, with moderate confidence. No timings from the incomplete attempt are used.

## Product-fix slice

- Done: SSR 8da11ee, RadialBar eb19d45, reactive dot 785b079, Legend 24e471c, rows 37eded7.
- Done: small cleanup c21885f; Reveal already moved in 4b885d0.
- Journey 7d15465: no overlaps; intentional fold flags documented (Opus, D-25e).
- Gate: typecheck, lint, code and bundle pass; Vitest 130 files / 1310 tests (`product-fix/gate-final-vitest.log`).
- Browser: playground zero real flags; motion 285 transitions clean (`product-fix/checks.md`).
- Numeric: only Journey reranks differ; other step frames exact (`product-fix/numeric-all-comparison.json`).
- Startup reported; no small library cause proved (`product-fix/startup-profile-report.md`).
- Evidence: `.evidence/release-1.0/product-fix/` (gates, reverse proofs, profiles, matching frames).
- Limits: fresh-mount capture varies even on phase 2; unequal-load timings are not compared.
- Assumptions: profile saved docs assets; full playground sweep plus final Journey route; Reveal already satisfied.

## Phase 3 part A

### 3.1 Strict declarations — done (731c327)
- Supersedes deferred entry in 94d517b; packed consumers and nullable-coordinate probe pass.
- Gate: typecheck/build/lint/code pass; Vitest 130 files / 1310 tests (`3.1-*.log`).
- Strict packed guard: 294 declarations, zero vccs errors; reports 100 third-party diagnostics.
- Guard retains missing-dependency/malformed-declaration checks with skipLibCheck false.
- Reverse packed scale-type patch fails guard; restoring the callable type passes.
- Evidence: `.evidence/release-1.0/part-a/` (`3.1-guard-*.log`, `3.1-consumers.log`).
- Assumptions: template skipLibCheck defaults; guard runs in Nuxt to supply optional Nuxt types.

### 3.2 Export surface — done (5894e4d)
- Explicit root/barrel exports; removed D-12a internals and obsolete exports.
- Every component Props type and TooltipPayloadEntry compile in both packed fixtures.
- Gate: typecheck/lint/code pass; Vitest 130 files / 1310 tests (`3.2-*.log`).
- Packed consumers pass; strict guard 295 files / zero vccs errors / 100 external diagnostics.
- Export snapshot reviewed; migration rows and TypeScript guide updated.
- Evidence: `.evidence/release-1.0/part-a/3.2-*.log`.
- Assumption: infer missing Props types from public constructors; useOffset removal follows D-12a now.

### 3.3 Internal props — done (c0aeeb3)
- Removed public internal props; LabelList uses internal LabelView geometry.
- Public Label blocks removed attrs from becoming internal view props; migration rows added.
- Gate: typecheck/lint/code pass; Vitest 131 files / 1316 tests (`part-a/3.3-*.log`).
- Packed consumers pass; strict guard 296 files / zero vccs errors / 100 external diagnostics.
- Reverse proofs fail removed-props table and Label attr regression; restored runs pass.
- Evidence: `.evidence/release-1.0/3.3/` and `.evidence/release-1.0/part-a/3.3-*.log`.
- Assumptions: Bar keeps D-13 model; Area default unclipped rendering and Line/Area id retained.

### 3.4 Chart prop sets and animation — done (f12c12a)
- Concrete cartesian, polar, radial and funnel props; dead props removed; migration rows added.
- Chart animation defaults inherit into series; explicit item overrides remain authoritative.
- Gate: typecheck/lint/code pass; Vitest 132 files / 1331 tests (`3.4-*.log`).
- Packed consumers pass; strict guard 298 files / zero vccs errors / 100 external diagnostics.
- Negative packed prop probes pass; reverse production patch fails 11 focused tests.
- Evidence: `.evidence/release-1.0/part-a/3.4-*.log` and `3.4-fix.patch`.
- Assumptions: retain polar layout/angle defaults; radial charts combine polar and bar sizing props.

### 3.5 Axis props — done (5e48b20)
- Shared typed AxisProps; concrete orientations/padding/defaults; portable custom scales.
- Strict template and packed positive/negative probes pass; docs and migration rows updated.
- Gate: typecheck/lint/code pass; Vitest 133 files / 1333 tests (`3.5-*.log`).
- Packed consumers pass; strict guard 299 files / zero vccs errors / 100 external diagnostics.
- Object-tick warning regression fails both rows without fix; restored focused checks pass.
- Evidence: `.evidence/release-1.0/3.5/` and `.evidence/release-1.0/part-a/3.5-*.log`.
- Assumptions: explicit forwarding preserves Vue fallthrough; custom scales keep numeric math boundary.

### 3.6 Active state and Brush range — done (3e3916d)
- Standalone roots own active models; conflicting Tooltips warn once and use the first controller.
- Brush has one normalized nullable range; controlled sync requests preserve source and rejected geometry.
- Gate: typecheck/lint/code pass; Vitest 134 files / 1371 tests (`3.6-*.log`).
- Packed consumers pass; strict guard 299 files / zero vccs errors / 100 external diagnostics.
- Active and Brush reverse proofs fail without fixes; restored focused checks pass; migration/docs updated.
- Evidence: `.evidence/release-1.0/3.6-active-*.log` and `.evidence/release-1.0/part-a/3.6-*.log`.
- Assumptions: primitive Sparkline identity is positional; supplied models control without listeners; private transport stays for 3.10.

### Part A final verification — done
- Steps 3.1–3.6 committed; per-step gates and packed consumers pass (`part-a/gate-summary.json`).
- Numeric comparison: 285 captures / 16245 frames, zero changes/errors (`numeric-all-comparison.json`).
- Motion lab: 285/285 transitions clean; seven accepted Journey flags unchanged, zero page errors (`motion-comparison.json`).
- Playground: exit 0; 22 page/view runs / 211 recordings, zero product flags; baseline coverage unchanged (`play-comparison.json`).
- Evidence: `.evidence/release-1.0/part-a/`; browser checks ran after Vitest and sequentially.
- Limits: machine load was not equal across runs, so timings were not compared; check:seen remains environment-limited.
- Next: Opus review, then Part B and its phase gate; private Tooltip transport remains for 3.10.

## Phase 3 part B

### 3.7 Accessible names and markup — done (a164398, 0ed00b0)
- All charts accept title/desc; human defaults, native attributes and data-slot contract retained.
- Gate: typecheck/lint/code/packed consumers PASS; Vitest 136 files / 1392 tests.
- Strict packed guard: 299 declarations, zero vccs errors; 100 third-party diagnostics reported.
- Reverse proofs fail old categorical names and missing chart markers; restored tests pass.
- Evidence: `.evidence/release-1.0/part-b/3.7-*.log`; markup proof `.evidence/release-1.0/markup-*.log`.
- Assumptions: neutral standalone plot group; Sparkline title overrides computed name; global pnpm cache required.

### 3.8 Series colors — done (ab9bfc6, 8ee554d)
- Numbered palette follows registration/entry order; default Treemap labels use known palette foregrounds.
- Gate: typecheck/lint/code/consumers PASS; final Vitest 137 files / 1396 tests; check:a11y exit 0.
- Reverse proofs fail numbered-token and default-foreground regressions; restored tests pass.
- Color changes: Treemap groups/label contrast, Sunburst branches, Sankey nodes/links and Calendar blue; other single colors retain blue.
- Motion lab explicit series colors stay; final numeric comparison follows at the phase gate.
- Evidence: `.evidence/release-1.0/part-b/3.8-*.log`, `.evidence/release-1.0/3.8-*-agent.log`.
- Assumptions: custom Treemap palette precedence stays; explicit teal/orange calendar demos stay; token overrides supply label foreground.

### 3.9 Typed rows — done (9eb6655, a7915fb)
- Curried selected components; standalone generic keys, slots and events retain source provenance.
- Gate: typecheck/lint/code/consumers PASS; Vitest 138 files / 1404 tests; real any types zero.
- Packed guard: 302 declarations, zero vccs errors, 100 external diagnostics; selected bundle and reverse proofs pass.
- Opus numeric Bar contract retained: null enter/leave/chase/exit 450 browser frames match geometry/opacity exactly.
- Bar baseline 39 captures / 2223 frames unchanged; motion 39/39 clean; evidence `.evidence/release-1.0/part-b/3.9-*`, `bar-null/`.
- Assumptions: deep paths retain runtime tails; raw chart callbacks take unknown; Heatmap example aliases its shadowed active binding.

### 3.10 Renames, slots, events and deprecations — done (f1e3264, f5c5cea)
- Renamed props without aliases; polar/grid slots, label formatter, indexed hover events and per-app warnings added.
- Private Tooltip activation uses numeric targets; hierarchy payload keys and public output strings stay at their boundaries.
- Gate: typecheck/lint/code PASS; Vitest 140 files / 1418 tests; zero cycles/unused/real any.
- Packed run exposed fixture template laxness; corrected strict Vite/Nuxt probes PASS against final declarations; packed rebuild not repeated.
- Reverse slot/formatter/grid/event/warning/resize proofs fail; restored regressions and SSR checks pass.
- Evidence: `.evidence/release-1.0/part-b/3.10-*.log`, `3.10-api-*`, `events-*`, `consumers-strict-*`.
- Assumptions: Recharts 3 slot geometry follows existing guards; Vue resize is an emit; native metadata allowlist is explicit.

### 3.11 Guides and examples — done (6307828, ce80e4b, 5f5840b, this log commit)
- Migration, theming, events, typed examples and stories use the final API; rendered migration/theming pages inspected.
- Gate: final typecheck/changed-file lint/code PASS; full Vitest 140 files / 1418 tests (`phase-3-verify.log`).
- Fresh Chromium/WebKit docs: 126 visits, zero findings/errors; isolated Line exits 0 with zero flags.
- Legacy grep prints nothing after the explicit exceptions below; final strict Vite/Nuxt probes PASS.
- Numeric comparison: 285 captures / 16245 frames unchanged; motion 285/285 clean with seven unchanged accepted flags.
- Evidence: `.evidence/release-1.0/part-b/`; raw full-gate failures and substituted checks are recorded below.
- Assumptions: factual prose follows existing Vue terminology; generated docs need rebuilding before their audit.

## Phase 3 gate after part B

Steps 3.7–3.11 are complete. The single full `pnpm verify` exits 1; its raw failures remain evidence. Focused corrections and retries below do not turn that original run into a pass. Browser checks ran sequentially, without full Vitest overlap. All `part-b/` paths below are under `.evidence/release-1.0/`.

| Check (Node 22 PATH prefix throughout) | Verdict | Final result and evidence |
| --- | --- | --- |
| `pnpm --filter vccs typecheck` | PASS | Exit 0; `part-b/final-typecheck.log`. |
| `pnpm --filter vccs exec vitest run --maxWorkers=2` | PASS | 140 files / 1418 tests; `part-b/phase-3-verify.log`. |
| `pnpm exec eslint .` | FAIL, corrected in scope | Raw four errors, eight warnings; affected docs corrected. Final changed-file lint exits 0 with zero warnings; `part-b/final-changed-eslint.log`. |
| Changed-file ESLint `--max-warnings 0` | PASS | Exact file selection/command in `part-b/final-commands.md`; repository-ignored internals excluded. |
| `pnpm check:code` | PASS | Zero cycles/unused/real-any/disables/ts-ignore; longest production file 562 lines; `part-b/phase-3-verify.log`. |
| `pnpm --filter vccs build` | PASS | Exit 0; `part-b/phase-3-verify.log`. |
| `pnpm check:package` | PASS | Fresh tarball 550 files, three exports/declarations; strict publint/attw pass; `part-b/phase-3-verify.log`. |
| `pnpm check:a11y` | PASS | 100 cases with new default colors; `part-b/a11y-final.json`. |
| `pnpm motion:report --prod --check` | PASS | 285/285 clean; seven accepted Journey flags unchanged, zero page errors; `part-b/motion-final.json`, `motion-comparison.json`. |
| `pnpm check:play` | FAIL, isolated retry PASS | Raw 22 views / 202 captures plus one execution row; desktop Line recorder timeout; `part-b/play-final.json`. |
| `pnpm check:play --skip-build --route=/line-charts --out=.evidence/release-1.0/part-b/play-line-retry` | PASS | Exit 0; two views / 35 recordings, zero flags; combined coverage 22 views / 211 recordings, zero flags; `part-b/play-retry-comparison.json`. |
| `node --test scripts/check-play.test.mjs` | PASS | Two tests; `part-b/phase-3-verify.log`. |
| `pnpm check:docs` | FAIL, stale first artifact | Chromium/WebKit zero findings; Firefox launch error. Initial generated docs were stale; `part-b/docs-first-stale.json`. |
| `pnpm check:docs --browser=chromium,webkit --out=.evidence/release-1.0/part-b/docs-final` | PASS | Fresh source: 126 visits, zero failed/engine errors; `part-b/docs-final/summary.json`, `docs-freshness.json`. |
| `node --test scripts/check-docs.test.mjs` | PASS | One test; `part-b/phase-3-verify.log`. |
| `pnpm check:seen` | Environment-limited | Exit 1; 322 rows, 19 flagged, 131 unreliable, zero errors; `part-b/seen-final.json`. |
| `node --test scripts/check-seen.test.mjs` | PASS | Two tests; `part-b/phase-3-verify.log`. |
| Strict consumer probes | PASS, limited substitute | Final Vite and Nuxt `vue-tsc --noEmit` exit 0; exact commands in `part-b/final-commands.md`, logs `final-strict-{vite,nuxt}.log`. |
| `pnpm bench --compare=.evidence/baseline/dist` | FAIL (authorized retry) | Exit 1; 21 interleaved rounds, 17/18 metrics pass, zero sampling errors; `part-b/bench-final.json`, `benchmark-spread.json`. |
| `pnpm check:bundle --assert-standalone` | PASS | 19 bundles, zero forbidden modules; BarList 8354 gzip bytes, within 8947 budget; `part-b/bundle-final.json`. |

The initial 3.10 packed consumer run failed five unused negative directives because fixtures did not enable strict templates. Their actual Vite/Nuxt builds and tree-shaking check passed; the guard reported zero vccs errors and 100 third-party diagnostics (`part-b/3.10-consumers.log`). Fixtures now enable strict templates and explicit native metadata names. Final focused probes use freshly built declarations; the full pack/build consumer run was not repeated, as instructed. Steps 3.7–3.9 have passing full consumer runs.

The repeated Line recorder timeout is tracked as P2 in `LATER.md`: full sweeps in 2.14 and 3B time out, isolated capture retries complete. The checker classifies the execution row as a product bug, but capture stall versus a page that never settles remains unknown. No full sweep was repeated. Firefox remains unavailable. Visitor-seen changed from Phase 2's 11 flagged / 134 unreliable to 19 / 131 (`step-2.14/seen-final.json` versus `part-b/seen-final.json`); unequal machine load prevents a timing conclusion.

### Geometry, motion and colors

`python3 .evidence/release-1.0/part-b/compare-numeric.py` compares complete frame JSON with Part A: 285 captures / 16245 frames, zero changed frames/captures/errors (`part-b/numeric-final/comparison.json`). The numeric Bar shape slot contract was retained: null in the middle through enter, leave, chase and exit matches default rectangle geometry and opacity across 450 frames (`part-b/bar-null/check.log`). Missing geometry receives no custom shape call while transition state is retained; no nullable fallback or decision amendment was needed.

Default-color comparison (`part-b/colors/comparison.json`, `colors/summary.json`) changes Calendar's 361 rect fills, Treemap's six rect fills plus one text foreground, Sankey's seven rect fills plus six path strokes, and Sunburst's 18 path fills. The other 16 base scenarios are unchanged. Sankey shared node/link defaults and Treemap contrast explain the stroke/text changes beyond the brief's shorthand “fills”; numeric geometry is unchanged. All before/after screenshots were inspected. Motion flags are identical to Part A (`part-b/motion-comparison.json`); timings from unequal-load runs are not compared.

### Before/after counts

Source: `node .evidence/release-1.0/part-b/counts.mjs 4b885d0 889e765 HEAD`, `part-b/counts.json`. Production excludes tests, stories, storybook and fixtures; lines are physical, `watch(` is a text count, real any uses TypeScript AST AnyKeyword. Phase 2's published 25 word matches included comments; its three real types are recomputed with the same AST method as the final run. Tests come from `step-2.14/verify-final.log`, `part-a/3.6-vitest.log`, and `part-b/phase-3-verify.log` respectively.

| Metric | Phase 2 `4b885d0` | Part A `889e765` | Part B final |
| --- | ---: | ---: | ---: |
| Production files | 296 | 300 | 303 |
| Production lines | 28437 | 28649 | 29135 |
| `watch(` | 36 | 27 | 27 |
| Real any types | 3 | 3 | 0 |
| Tests | 1302 | 1371 | 1418 |

### Legacy grep exceptions

`python3 .evidence/release-1.0/part-b/check-migration-grep.py` runs PLAN's legacy regex and prints nothing after these intentional exceptions (`part-b/3.11-grep.log`, `3.11-grep-exceptions.json`). The migration page necessarily shows old names; generated `.output`, `.nuxt`, `dist` and dependency copies are excluded.

| Authored path | Retained match |
| --- | --- |
| `docs/app/components/ChartDemo.vue` | Native control aria-label |
| `docs/app/components/InstallCommand.vue` | Native button aria-label |
| `docs/app/components/LandingCodeCard.vue` | Native control aria-label |
| `docs/app/components/LandingHeader.vue` | Native control/navigation aria-label |
| `docs/app/pages/design-system.vue` | Native button aria-label |
| `playground/nuxt/app/layouts/default.vue` | Native navigation/button aria-label |
| `playground/nuxt/app/components/area-charts/AreaChartInteractive.vue` | Native select aria-label |
| `playground/nuxt/app/components/line-charts/LineChartInteractive.vue` | Native select aria-label |
| `playground/nuxt/app/components/pie-charts/PieChartInteractive.vue` | Native select aria-label |
| `packages/vue/src/chart/BarList.tsx` | Native rendered aria-label |
| `packages/vue/src/chart/CellGridLayer.tsx` | Native rendered aria-label |
| `packages/vue/src/chart/ChartWrapper.tsx` | Native rendered aria-label |
| `packages/vue/src/chart/JourneySankey.tsx` | Native rendered aria-label |
| `packages/vue/src/chart/Sparkline.tsx` | Native rendered aria-label |
| `packages/vue/src/chart/__tests__/accessibleNames.spec.tsx` | Public native-name assertions |
| `packages/vue/src/components/legend/Legend.tsx` | Native rendered aria-label |
| `packages/vue/src/cartesian/brush/components/TravellerLayer.tsx` | Native traveller aria-label |
| `packages/vue/src/cartesian/brush/type.ts` | Distinct Brush traveller ariaLabel prop |

### Benchmark baseline preparation

The first `pnpm bench --compare=.evidence/baseline/dist` failed during baseline setup, before any sampling: the saved distribution could not resolve reselect (`part-b/phase-3-bench.log`, `bench-setup-failure.json`). Its locked reselect 5.1.1 from `83dc1b0:pnpm-lock.yaml` was restored from the local pnpm cache into the ignored baseline folder, with each file's cached SHA512 verified (`part-b/baseline-restoration.json`). Repository dependencies and lockfile are unchanged. Prepare that locked baseline dependency up front for the next gate. Opus authorized one benchmark retry; the failed attempt remains evidence and contributes no timings.

### Benchmark medians and spread

Source: `part-b/benchmark-spread.json`, derived from the final retry `bench-final.json`. A is the saved baseline; B is the current build. Equal-work samples are interleaved in the same browser without other verification processes. Ranges are min–max across the completed rounds. Static units are ms; animated units are CPU ms/frame. Values below are rounded for display; the gate uses unrounded values. No timing comparison is made with earlier unequal-load runs.

| Case | Mode/metric | A median (range) | B median (range) | B/A | Gate |
| --- | --- | ---: | ---: | ---: | --- |
| LineChart 100 | static / mountMs | 12.000 (10.500–15.900) | 11.100 (9.800–12.900) | 0.9250 | PASS |
| LineChart 100 | static / updateMs | 3.300 (2.900–4.200) | 3.200 (2.700–3.700) | 0.9697 | PASS |
| LineChart 1000 | static / mountMs | 41.900 (37.000–50.200) | 42.500 (37.100–216.800) | 1.0143 | PASS |
| LineChart 1000 | static / updateMs | 16.900 (14.800–23.700) | 17.300 (15.000–21.900) | 1.0237 | PASS |
| LineChart 10000 | static / mountMs | 383.500 (354.200–515.400) | 379.000 (345.500–525.800) | 0.9883 | PASS |
| LineChart 10000 | static / updateMs | 171.300 (155.800–183.500) | 176.500 (153.100–344.200) | 1.0304 | PASS |
| BarChart 100 | static / mountMs | 9.500 (8.600–43.900) | 9.100 (8.100–13.900) | 0.9579 | PASS |
| BarChart 100 | static / updateMs | 3.100 (2.500–3.700) | 2.900 (2.400–3.200) | 0.9355 | PASS |
| BarChart 1000 | static / mountMs | 27.400 (25.200–34.000) | 28.800 (26.400–42.500) | 1.0511 | PASS |
| BarChart 1000 | static / updateMs | 11.700 (10.600–15.300) | 12.400 (10.900–18.000) | 1.0598 | PASS |
| BarChart 10000 | static / mountMs | 237.700 (216.900–345.200) | 261.400 (228.900–695.400) | 1.0997 | PASS |
| BarChart 10000 | static / updateMs | 106.500 (99.500–138.000) | 118.300 (104.500–180.000) | 1.1108 | FAIL |
| Heatmap 168 | static / mountMs | 5.300 (4.700–6.700) | 5.600 (4.900–9.200) | 1.0566 | PASS |
| Heatmap 168 | static / updateMs | 3.100 (2.800–3.700) | 3.300 (2.800–4.200) | 1.0645 | PASS |
| CalendarHeatmap 365 | static / mountMs | 20.500 (18.600–30.400) | 21.400 (19.500–66.000) | 1.0439 | PASS |
| CalendarHeatmap 365 | static / updateMs | 17.600 (16.100–23.700) | 18.200 (16.400–27.900) | 1.0341 | PASS |
| LineChart 1000 | animated / cpuMsPerFrame | 8.935 (7.793–10.980) | 8.574 (7.631–10.520) | 0.9596 | PASS |
| BarChart 1000 | animated / cpuMsPerFrame | 5.916 (5.543–6.840) | 5.764 (5.210–9.328) | 0.9744 | PASS |

Anomaly: the BarChart static update median at the largest case exceeds the unchanged 1.10 ratio limit (1.1108 observed); its baseline/current ranges overlap. The previous Phase 2 benchmark passed, but its load is not comparable. Sampling variation or added API work may contribute; cause is unproven and no performance conclusion is drawn from this run. The failed verdict is retained without another retry.

### Phase 3 regression follow-up

Done: reader 2d298fd and Bar fix (this commit); 9eb6655 added the path parser and unused slot-prop geometry reads.
Gate: typecheck, 1,418 Vitest tests, ESLint 0 warnings, check:code and standalone bundle check PASS.
Numeric: 285 captures / 16,245 frames and motion metrics unchanged; packed Vite/Nuxt consumers PASS.
Bench: 18/18 PASS; Line/Bar 10,000 update ratios 0.985/1.034, mount 0.941/1.024; medians/ranges in benchmark-spread.json.
BarList: 8,008 B gzip; cached reader ~193 B accepted; remaining ~43 B tracked for 4.3 in LATER.md.
Evidence: .evidence/release-1.0/regression-follow-up/. Assumptions: cache forms per key; preserve the existing accessor return boundary.

## Phase 4 mechanical slice

### Tooling prerequisites — done (61ab6ee; recorder sweeps pending)
- Independent static motion targets; empty coverage rejection; bounded lifecycle; metrics/guide checks wired.
- Gate: typecheck and ESLint zero warnings; coverage-run Vitest 140 files / 1418 tests PASS.
- Coverage before surgery: lines 90.45%, branches 79.54% (`tooling-vitest-coverage.log`).
- Final tooling regressions 14/14 PASS; cut-off, filter, empty CLI, lifecycle and recorder reverse controls fail.
- Diagnostic playground: 22 views / 211 captures, zero real flags; historical timeout cause not proven.
- Evidence: `.evidence/release-1.0/phase-4/`; recorder recovery sweep and final verify provide follow-up.
- Assumptions: deterministic paired bootstrap intervals declare benchmark uncertainty; unchanged ratio boundaries.
