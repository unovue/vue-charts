# Progress

Update after every step (README.md, "How to work"). Status: `todo`, `done`, `deferred`.

The dependency and release-impact columns support honest reporting; they do not replace
README.md's unchanged deferral or final-acceptance rules. `assess` means identify whether the
cleanup closes a required finding or gate before starting it. Record the command, commit,
result and compact evidence reference; an unrun or inconclusive check is not a pass.

## Baselines (phase 0)

| Measure | Value |
| --- | --- |
| `pnpm verify` verdict | FAIL on unchanged library source at `83dc1b0`; full table below. Initial tests: 2 load-sensitive failures; both permitted single-file reruns pass. Lint: exit 0 (39 existing warnings); build/package: pass. Additional browser/checker/build failures are retained, not treated as passes. |
| Tests (files / tests) | 126 / 1,240 (initial full run: 1,238 pass, 2 fail; isolated reruns: 64/64 slots and 16/16 motion engine pass). Step gate rerun with two workers: 126/126 files, 1,240/1,240 tests pass (74.63 s). |
| Coverage (statements / branches / lines) | |
| Suite wall time | 174.50 s initial default-worker run; isolated slot rerun 27.44 s, motion-engine rerun 1.09 s. No timing thresholds changed. |
| Bench medians | see `.evidence/bench/` file: |
| Gzip per chart (`check:bundle`) | |
| Consumer offline install/build and lockfile hashes | PASS under macOS `sandbox-exec` denying all network access; denial positive control returns `EPERM`. Source `83dc1b0`. Saved lock SHA-256: Vite `b11206344e3e79657aafa0f63d16e3b7b0a01adc48a76fcd5f7321ceeb44387e`; Nuxt `9e3e170ae41d511eb3526278c8449a0697df015a8c6cb76b5647c8ae2ce6702d`. Runtime archive refresh hashes are logged in `consumers-offline.log`. |
| Baseline source commit and tool versions | `83dc1b066a71849314dc1a3922a8b367043862a0`; Node 22.23.3, pnpm 9.15.0, Vite 8.3.2, Vitest 4.1.11, Playwright 1.58.2. Library runtime: Vue 3.5.18, motion-v 2.5.2. Packed consumers: Vue 3.5.43, motion-v 2.6.0, TypeScript 6.0.3, Nuxt 4.5.2. |
| Environment limits | Firefox 1509 launch times out after macOS sandbox extension denial / SWGL framebuffer failure. Chromium and WebKit launch. Setup docs sweep: 128 visits, four BarList SVG-only checker failures; Firefox not run. These are not reported as passes. |

## Steps

| Step | Title | Release-blocking | Dependencies | Status | Commits | Verification evidence and notes |
| --- | --- | --- | --- | --- | --- | --- |
| 0.1 | Environment and baseline verdict | yes | — | done | `c0c4d81`, `745da98`, `9e82e9b`, `a25538c` | Frozen install, Node 22 setup, locked/prefetched consumers and fresh network-denied typechecks/builds PASS. Step gate: current-config typecheck PASS; 126 files / 1,240 tests PASS with two workers; changed-file lint PASS with zero warnings. Full untouched-library baseline recorded below, including failed/unavailable checks. No library/model source changes. |
| 0.2 | Baseline build, benchmark and bundle scripts | yes | 0.1 | todo | | |
| 0.3 | Coverage that runs | yes | 0.1 | todo | | |
| 1.1 | License notice | yes | phase 0 | todo | | |
| 1.2 | Stack ids that match Object members | yes | phase 0 | todo | | |
| 1.3 | Tooltip `shared` reacts to changes | yes | phase 0 | todo | | |
| 1.4 | Funnel arrow keys never throw | yes | phase 0 | todo | | |
| 1.5 | Edge-data bugs | yes | phase 0 | todo | | |
| 1.6 | Keyboard for item charts | yes | 1.4 | todo | | |
| 1.7 | Treemap, Sankey, SunburstChart: attributes, names, keyboard | yes | 1.6 | todo | | |
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
| 0 | | | | | |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

## Assumptions

Small choices made where the plan was silent (README.md, "Rules"). Record evidence-backed
amendments to DECISIONS.md here too, including the reproduction and preserved contract.

## Deferred

Steps that could not be finished: what failed, what was tried, the best explanation, dependent steps and unavailable gates.

## Step 0.1 evidence

Untouched-library baseline: `PATH=<task-local Node 22 runtime>:$PATH CI=true pnpm verify`,
exit 1. Source paths `packages/vue/src`, `docs` and `playground` have no diff from `83dc1b0`.
The verifier observed documentation-only setup commits while running; these do not change the
library baseline. This completes the baseline-recording criterion, not a green release gate.

| Baseline check | Original verdict | Time | Evidence / disposition |
| --- | --- | --- | --- |
| Unit tests | FAIL | 180 s | 1,238/1,240 initially; both isolated reruns PASS; subsequent complete step suite PASS 1,240/1,240. No threshold changes. |
| Lint | PASS | 51 s | 39 pre-existing warnings; changed-file lint has zero warnings. |
| Library build | PASS | 32 s | Node 22 build; preserved baseline dist/archive. |
| Package exports/types | PASS | 20 s | 583 files, three entry points; strict publint/attw checks. |
| Motion lab | FAIL | 1,605 s | 283/285 transitions clean; exactly D-25 Journey top8/top15 flags; no additional geometry failure. Repair gate in 1.13. |
| Playground | FAIL | 660 s | 228 recordings, 22 real page/viewport visits; 679 flags. Baseline checker labels 630 product flags and 49 artifacts. At least 549 teleports are proven zero-alpha artifacts; other eligibility/target defects and opaque geometry/overflow findings remain open. See `play-baseline-diagnosis.md`. |
| Docs | FAIL / Firefox NOT RUN | 217 s | 128 Chromium/WebKit visits, four BarList SVG-only checker failures; Firefox launch error. Existing generated docs artifact was served: its source provenance is unverified. No claim that this substitutes for a fresh docs build. |
| Visitor-seen | NOT RUN after build FAIL | 63 s | 0 rows: fresh docs build fails because nuxt-og-image imports `createHeadCore` from the Nuxt-resolved @unhead/vue 3.4.2, which does not export it. Logs: `.evidence/seen/build-docs.log`, `summary.json`. Investigate under docs/integration work (1.14/3.11); the entrance gate is unavailable until the build works. |

- Working checkout: `/Users/matthias/Git/forks/fork_vue-charts-cellgrid-main`, branch `release/1.0`. The requested checkout points to another branch with unrelated changes and is preserved. No pushes, publication, deployments or metadata changes.
- Evidence directory: `.evidence/release-1.0/`. `install.log`, `baseline-verify-node22.log`, `baseline-typecheck.log`, `consumer-prepare.log`, `consumers-offline.log`, `network-denial-control.log`, `refresh-probe-repacked.log`, `refresh-probe-install.log`, `baseline-slots-rerun.log`, `baseline-motion-engine-rerun.log`, `step-0.1-tests.log`, `step-0.1-lint.log`. Logs and screenshots remain ignored.
- Offline command: `sandbox-exec -p '(version 1)(allow default)(deny network*)' node scripts/check-consumers.mjs`, with the locally downloaded Node 22 directory prepended to PATH. Both fresh applications install with `--offline --frozen-lockfile`, typecheck, and build. The explicit network-denial control returns `EPERM`.
- Archive refresh reproduction: append a marker to the disposable packed README, repack at the same `../vccs.tgz` path, run `pnpm update vccs --offline --lockfile-only` under network denial, then a frozen offline install. The lock diff changes only the local archive integrity; the installed README contains the new marker. No integrity is hand-edited.
- A first refresh probe was mistakenly placed inside the workspace. pnpm discovered the root workspace and changed its lockfile. The agent's change was recorded in `workspace-probe-unintended.diff` and fully restored from HEAD; no pre-existing root changes existed. The successful probe and runner use temporary directories outside the workspace.
- A Node 24 baseline attempt was terminated after Node 22 became available; it is inconclusive and is not the baseline verdict.
- The baseline dist is preserved at `.evidence/baseline/dist` from the original consumer-preparation tarball, built from `83dc1b0` with Node 22. A copy attempted during the verifier's rebuild was incomplete and replaced in full from that archive.
- Setup docs reproduction: `/charts/bar-list` renders the expected HTML list and links. `check-docs` erroneously requires `svg.v-charts-surface` from every demo and reports the visible list as absent. Repair this family-specific assertion in 1.14 with a positive control; D-14's semantic-list behavior is preserved.

### Evidence-backed plan corrections during setup

- A read-only subagent inventory found 56 P1/P2 findings across the eight reviews and one missing disposition: ssr-a11y.md P2 row 4 (ComposedChart paint order). The main agent reproduced it with the packed `83dc1b0` baseline in Chromium: hydrated Bar → Area → Line; static Area → Bar → Line; identical sorted path geometry; no browser errors. The screenshot confirms different overlap. D-22a now specifies stable registration order within the existing layer tiers; PLAN 2.0 adds the regression and current-path fix before model migration, retained through 2.3. This finding remains unfixed. Evidence: `.evidence/release-1.0/paint-order/{probe.mjs,result.json,comparison.png}`.
- D-17 and PLAN 3.3 wording formerly forbade Bar's `activeIndex` runtime prop while D-13/3.6 required that same prop for the new model. Clarified that the old one-way contract is replaced, internal view props are removed, and the new model prop/update emit remain supported. No API behavior is changed at setup.
- The original and saved `--prepare` runs both typecheck/build Vite and Nuxt; the normal runner also passes with network denied. Corepack was enabled only in the task-local runtime directory and reports pnpm 9.15.0.
- The untouched baseline playground sweep reveals a second checker defect: all 121 cell-chart teleport flags compare unpainted rectangles (62 zero fill opacity, 59 transparent fill, no visible stroke) at 427→452 ms. D-25b and PLAN 1.9 require a painted-visibility correction with opaque/stroke-only positive controls, keeping thresholds unchanged. Evidence: `.evidence/breakit/B9/cell-charts-1280-hover-2.json` and `cell-charts-1280-result.json`. Transient Area/Funnel overflow and unexplained Line/Dashboard flags remain open; no passing baseline is claimed.
