# Progress

Update after every step (README.md, "How to work"). Status: `todo`, `done`, `deferred`.

The dependency and release-impact columns support honest reporting; they do not replace
README.md's unchanged deferral or final-acceptance rules. `assess` means identify whether the
cleanup closes a required finding or gate before starting it. Record the command, commit,
result and compact evidence reference; an unrun or inconclusive check is not a pass.

## Baselines (phase 0)

| Measure | Value |
| --- | --- |
| `pnpm verify` verdict | |
| Tests (files / tests) | |
| Coverage (statements / branches / lines) | |
| Suite wall time | |
| Bench medians | see `.evidence/bench/` file: |
| Gzip per chart (`check:bundle`) | |
| Consumer offline install/build and lockfile hashes | |
| Baseline source commit and tool versions | |
| Environment limits | |

## Steps

| Step | Title | Release-blocking | Dependencies | Status | Commits | Verification evidence and notes |
| --- | --- | --- | --- | --- | --- | --- |
| 0.1 | Environment and baseline verdict | yes | — | todo | | |
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
