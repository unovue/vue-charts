# Starting the cloud run

## 1. Cloud environment (Codex settings, once)

- Repository: `Mat4m0/fork_vue-charts`, branch `release/1.0`.
- Node 22.
- Setup script:

```bash
corepack enable
pnpm install --frozen-lockfile
node scripts/check-motion.mjs --install-browser
node scripts/check-docs.mjs --install-browsers
```

- The setup script installs the workspace and browsers. PLAN 0.1 must also lock and prefetch
  the packed Vite/Nuxt consumer fixtures; the current runner creates unlocked temporary apps.
  Keep network access available for that preparation. After a fresh offline consumer install
  and build passes, record its command and lockfile hashes in PROGRESS.md before disabling
  network access for subsequent runs. Do not infer offline readiness from the workspace lockfile.

## 2. Goal prompt (paste as is)

```text
Take vccs to a release-worthy 1.0 on branch release/1.0, alone and to the end.

The complete brief is internals/release-1.0/. Read README.md, DECISIONS.md and PLAN.md fully
before you change anything. README.md is your operating manual: environment, step gate, rules,
commits, and what to do when a step cannot be finished. DECISIONS.md supplies the contracts:
do not invent names, wording, colors, defaults or behavior it does not give. If a consumer
reproduction disproves an implementation choice, record the evidence and amend that choice
before proceeding; preserve the intended behavior and verification strength. PLAN.md has 52
steps in five phases, each with a definition of done.

Work like this:
- Follow PLAN.md's dependency order, including 2.11 before 2.10, one step at a time. For each:
  make the change, add the tests it names, run the step gate and the step's own checks, commit
  (Conventional Commits, git commit
  --no-verify), and update internals/release-1.0/PROGRESS.md in the step's last commit.
- Run each phase gate and record its verdict table in PROGRESS.md.
- Complete strict typing and the critical behavior regressions in 2.0 before rewriting the
  model. Keep nested-data behavior, correct aggregate payload types and one selection owner.
- A temporary adapter may cross slices only under the tracking/removal rule in PLAN phase 2;
  it must not duplicate state ownership.
- Never weaken a check, threshold or test to pass it. Never git stash, never rewrite history,
  never publish, never change package.json name/version/homepage/repository.
- If a step cannot meet its definition of done after three real attempts, revert its commits
  with git revert, mark it deferred in PROGRESS.md with the evidence, and continue with the next
  step that does not depend on it. Record dependent steps and unavailable phase gates as
  deferred with their missing prerequisites; never report an unrun check as passed.
- Do not stop to ask questions. Where the plan is silent on a small choice, follow the closest
  existing pattern in the codebase and record it under Assumptions in PROGRESS.md.

You are done when every step is done or deferred with evidence, `pnpm verify` passes every check
of PLAN.md step 4.8, and internals/release-1.0/REPORT.md is written as PLAN.md step 4.9 describes.
README.md's deferral and final-acceptance rules are unchanged. Distinguish measured results,
inconclusive measurements and environment-limited checks in the report.
```

## 3. Checking in during the run

- Progress: `internals/release-1.0/PROGRESS.md` on the branch.
- Ask Opus to review a finished phase: "Review phase N of release/1.0 against
  internals/release-1.0/PLAN.md" (diff, key checks rerun, visual pass on the changed charts).
