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
| 1.6 | Keyboard for item charts | yes | 1.4 | done | `f8484c3` | 127 files / 1,258 tests; typing and changed-file lint PASS. |
| 1.7 | Treemap, Sankey, SunburstChart: attributes, names, keyboard | yes | 1.6 | done | final commit below | 128 files / 1,261 tests; typing and changed-file lint PASS. |
| 1.8 | Reduced motion hydrates cleanly | yes | phase 0 | todo | | |
| 1.9 | Contrast, Legend and Brush semantics, and an a11y check | yes | 1.6–1.8 | todo | | |
| 1.10 | BarList: height, index and per-frame cost | yes | phase 0 | todo | | |
| 1.11 | Engine: equal data, cascades, springs, events, one clock | yes | phase 0 | todo | | |
| 1.12 | Motion tokens, shared cascade, moving labels | yes | 1.11 | todo | | |
| 1.13 | Lab: current curve, list height, accepted flags | yes | 1.10–1.12 | todo | | |
| 1.14 | Docs facts from phase 1 | yes | 1.8, 1.12–1.13 | todo | | |
| 2.0 | Strict typing and tests that survive the refactor | yes | phase 1 | todo | | |
| 2.1 | Slice 0: delete dead paths | yes | 2.0 | todo | | |
| 2.2 | Slice 1: root inputs as getters | yes | 2.1 | todo | | |
| 2.3 | Slice 2: registries | yes | 2.2 | todo | | |
| 2.4 | Slice 3a: layout math | yes | 2.3 | todo | | |
| 2.5 | Slice 3b: axis model part 1 | yes | 2.4 | todo | | |
| 2.6 | Slice 3c: axis model part 2 | yes | 2.5 | todo | | |
| 2.7 | Slice 3d: tooltip model | yes | 2.6 | todo | | |
| 2.8 | Slice 3e: cartesian series | yes | 2.7 | todo | | |
| 2.9 | Slice 3f: polar series | yes | 2.8 | todo | | |
| 2.11 | Slice 5: standalone charts on TooltipSource and ChartShell | yes | 2.9 | todo | | |
| 2.10 | Slice 4: delete the store shell | yes | 2.11 | todo | | |
| 2.12 | Slice 6: context ownership | yes | 2.10 | todo | | |
| 2.13 | Remaining architecture findings | assess | 2.12 | todo | | |
| 2.14 | Code health gates | yes | 2.13 | todo | | |
| 3.1 | Recheck strict public declarations | yes | phase 2 | todo | | |
| 3.2 | Export surface | yes | phase 2 | todo | | |
| 3.3 | Internal props out of the public API | yes | phase 2 | todo | | |
| 3.4 | Chart prop sets and chart-level animation | yes | phase 2 | todo | | |
| 3.5 | Axis props | yes | phase 2 | todo | | |
| 3.6 | Active state and Brush range | yes | phase 2 | todo | | |
| 3.7 | Accessible names and the markup contract | yes | phase 2 | todo | | |
| 3.8 | Series colors | yes | phase 2 | todo | | |
| 3.9 | Typed rows | yes | phase 2, 3.2, 3.4–3.6 | todo | | |
| 3.10 | Renames, slots, events, deprecations | yes | phase 2, 3.2 | todo | | |
| 3.11 | Docs, playground and stories on the 1.0 API | yes | 3.1–3.10 | todo | | |
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
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
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
- Assumptions: keep existing tooltip label wording; identify equal-data-key series by their registered configuration; use Node 22.23.1 and two workers. Commit: this step's final commit.

## Step 1.7 evidence
- Done: root attrs, D-15 titles/descriptions, D-14 spatial/pre-order navigation and Enter node-click; nested Treemap paths use source identity.
- Three public table cases PASS; source reverse makes all three fail. Removing the Sunburst totals read alone fails its parent tooltip case; restored. [Proofs](../../../.evidence/release-1.0/step-1.7-aggregate-reverse.log).
- Gate PASS: 128 files / 1,261 tests (70.56s), typecheck, changed-file eslint zero warnings. Correct combiner input types remove three obsolete suppression directives. [Suite](../../../.evidence/release-1.0/step-1.7-tests.log).
- Chromium before/after at 900px and 390px: six charts show tooltips/live text/outlines, zero page errors. [Final results](../../../.evidence/release-1.0/keyboard-browser/after-1.7.json); screenshots alongside.
- Surprise: parent Sunburst rows without value had no tooltip; canonical layout totals now supply it. A browser run overlapped the reverse proof; superseded and rerun against stable source.
- Assumptions: keep existing pointer indexes/event nodes; keyboard clicks carry KeyboardEvent; fixed-size browser fixtures isolate keyboard behavior. Commit: this step's final commit.
