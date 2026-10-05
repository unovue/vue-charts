# vccs 1.0: goal and operating manual

This folder is the complete brief for taking vccs from 0.6.0 to a release-worthy 1.0. It is
written for one autonomous agent (Codex) working alone in a cloud session. Everything you need
is here or in the repository. Nobody will answer questions during the run: every decision is
already made in [DECISIONS.md](DECISIONS.md), and every step has a definition of done.

## Outcome

vccs 1.0 is the chart library a Vue developer would design if Recharts did not exist, and its
codebase is one a maintainer reads with pleasure:

- **Correct**: every finding of the eight reviews in [reviews/](reviews/) is fixed or decided.
- **Vue-native core**: one typed chart model made of getters, registries and `computed`s. No
  store shape, no `reselect`, no props copied into state by watchers. The math ported from
  Recharts stays as pure functions in `core/`.
- **One clean public API**: Recharts concepts and math; Vue patterns (slots, emits, `v-model`,
  typed generics) for customizing, listening and controlling. One way per job.
- **Accessible**: every chart is reachable and readable by keyboard and screen reader; text
  reaches WCAG AA contrast in light and dark themes.
- **Motion stays excellent**: the frame-exact lab stays clean; the known gaps are closed.
- **Fast and small**: no regression against the 0.6.0 baseline; standalone charts stop shipping
  the cartesian axis stack; size budgets guard every chart.
- **Proven**: every claim has a check that runs in this repository and can fail.

## Files

| File | Purpose |
| --- | --- |
| [DECISIONS.md](DECISIONS.md) | Every product, API and architecture decision. Binding. |
| [PLAN.md](PLAN.md) | The ordered steps, phase by phase, each with exact changes and a definition of done. |
| [PROGRESS.md](PROGRESS.md) | Your log. Update it after every step. |
| [reviews/](reviews/) | The eight review reports this plan is based on, plus reproduction specs and audit scripts to reuse. Evidence files they mention (screenshots, JSON under `.evidence/`) are not in the repository. |

Read this file, DECISIONS.md and PLAN.md completely before the first step. Read a review
report when a step points to it.

## How to work

1. **Order.** Do the steps in PLAN.md in order. A step may start only when the previous step is
   done or deferred (see "When a step cannot be finished").
2. **One step at a time.** Make the change, add or update the tests the step names, run the step
   gate and the step's own checks, then commit. Small atomic commits are fine within a step.
3. **Commits.** Conventional Commits (`type(scope): description`, imperative, lower case).
   Scopes: `core`, `chart`, `state`, `motion`, `a11y`, `api`, `test`, `perf`, `docs`, `build`,
   `release`. Commit with `git commit --no-verify` (you run the checks yourself; the hook
   would only repeat lint). The last commit of a step includes the PROGRESS.md update.
4. **PROGRESS.md.** After each step: status (`done` / `deferred`), commit hashes, the gate
   results (pass counts, numbers), and any assumption you made. Keep it short and factual.
5. **Phase gate.** At the end of each phase run the phase gate in PLAN.md and record the
   verdict table in PROGRESS.md. A phase is done only when its gate passes.
6. **Final report.** After the last step write `internals/release-1.0/REPORT.md` (format in
   PLAN.md, step 4.9).

## Step gate (run after every step)

```bash
pnpm --filter vccs typecheck
pnpm --filter vccs exec vitest run
pnpm exec eslint $(git diff --name-only --diff-filter=d HEAD~1 -- '*.ts' '*.tsx' '*.vue' '*.mjs') --max-warnings 0
```

Adjust the eslint file list to all files the step changed. All tests must pass. Under heavy
machine load a few long tests can time out; rerun the failing file alone once. A test that
fails twice is a real failure.

When a step changes rendering, motion or the published package, it also names the browser or
package checks to run. Run them.

## Environment setup (once, at the start)

```bash
corepack enable
pnpm install --frozen-lockfile
node scripts/check-motion.mjs --install-browser      # Chromium headless shell + system deps
node scripts/check-docs.mjs --install-browsers       # Chromium, Firefox, WebKit for check:docs
pnpm --filter vccs build
```

- Node 22 (CI uses 22).
- The browser checks read `MOTION_EXECUTABLE_PATH` only to override Chromium; leave it unset in
  the cloud so Playwright uses the browser it installed.
- If a browser engine cannot launch in this environment (missing system libraries), record it
  in PROGRESS.md and run that check with the engines that do launch, for example
  `pnpm check:docs --browser=chromium,webkit`. A launch failure is an environment limit, not a
  product failure. Chromium must work; if it does not, fix the environment first.
- Browser timing checks (`check:seen`, real-clock frame timings) are sensitive to machine load.
  The frame-exact lab (`motion:report --prod --check`) uses a fake clock and is not.

## Rules

- **Decisions are binding.** Do not invent names, wording, colors, defaults or behavior that
  DECISIONS.md or PLAN.md does not give. When something small is unspecified, follow the
  closest existing pattern in the codebase and record it under "Assumptions" in PROGRESS.md.
- **Never weaken a check to pass it.** No lowered thresholds, no `it.skip`/`it.only`, no
  deleted assertions, no new entries in an allowlist, unless PLAN.md says so.
- **Tests** (the maintainer's rules):
  - Before writing a test, name the realistic wrong behavior it catches. No such behavior, no test.
  - Test behavior through the public interface (render from `@/index`, assert DOM, events,
    emitted values). Do not test implementation structure or what Vue, TypeScript or a library
    already guarantees.
  - A bug fix gets one regression test that fails without the fix. Prove it: revert the fix
    locally (a reverse patch, never `git stash`), see the test fail, restore.
  - Mock only external services and the clock. Tables for input matrices. Literal expected values.
  - No one-use helpers, no fakes that re-implement product logic, no blanket console silencing.
  - Delete tests that no longer protect behavior.
- **Code**:
  - Prefer delete > simplify > replace > add. One source of truth per concept.
  - `defineComponent` + TSX, as the codebase does (see the repository `CLAUDE.md`).
  - `import type` for type-only imports.
  - No new `any`, `as any`, `@ts-ignore`. A `@ts-expect-error` needs a comment saying why.
  - Comments explain intent, constraints or non-obvious behavior, and stay in sync with the code.
  - No new dependencies. Everything the plan needs (`d3-color`, `esbuild`, `madge`, `knip`, `axe-core`) is
    already in the lockfile, so the run works without network access after setup.
- **Git**: never `git stash`, never rewrite or force-push history, never merge other branches,
  never commit to `main`. Do not push unless the cloud environment does it for you.
- **Do not change** `package.json` `name`, `version`, `homepage` or `repository`. Do not
  publish to npm. Do not bump versions. Do not edit `.github/` secrets or deploy anything.
- **Ports.** Start dev servers on ports 4600–4699 and stop every process you started.
- **Evidence** goes to `.evidence/` (git-ignored). Never commit screenshots or logs.

## When a step cannot be finished

Do not stop the run. Make at least three real attempts with different approaches. If the step's
definition of done still fails:

1. Revert the step's partial commits with `git revert` (no history rewrite), so the branch stays
   green.
2. In PROGRESS.md mark the step `deferred` and write: what failed (command and output excerpt),
   what you tried, and your best explanation.
3. Continue with the next step that does not depend on it. PLAN.md lists dependencies.

A deferred step is acceptable. A green-looking step that hides a failure is not.

## Final acceptance (all must hold at the end)

1. `pnpm verify` passes every check (the list grows during the run; PLAN.md step 4.8 gives the
   final list).
2. The motion lab is clean except the accepted flags listed in DECISIONS.md D-25.
3. Every P1 and P2 finding in [reviews/](reviews/) is fixed or has a decision in DECISIONS.md;
   REPORT.md maps each finding to its commit or decision.
4. PLAN.md's done-criteria hold for every step not marked `deferred`.
