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

- Agent internet access can stay off: every package the plan needs is in the lockfile and the
  browsers are installed by the setup script.

## 2. Goal prompt (paste as is)

```text
Take vccs to a release-worthy 1.0 on branch release/1.0, alone and to the end.

The complete brief is internals/release-1.0/. Read README.md, DECISIONS.md and PLAN.md fully
before you change anything. README.md is your operating manual: environment, step gate, rules,
commits, and what to do when a step cannot be finished. DECISIONS.md is binding: do not invent
names, wording, colors, defaults or behavior it does not give. PLAN.md has 52 steps in five
phases, each with a definition of done.

Work like this:
- Do the steps in PLAN.md in order, one at a time. For each: make the change, add the tests it
  names, run the step gate and the step's own checks, commit (Conventional Commits, git commit
  --no-verify), and update internals/release-1.0/PROGRESS.md in the step's last commit.
- Run each phase gate and record its verdict table in PROGRESS.md.
- Never weaken a check, threshold or test to pass it. Never git stash, never rewrite history,
  never publish, never change package.json name/version/homepage/repository.
- If a step cannot meet its definition of done after three real attempts, revert its commits
  with git revert, mark it deferred in PROGRESS.md with the evidence, and continue with the next
  step that does not depend on it.
- Do not stop to ask questions. Where the plan is silent on a small choice, follow the closest
  existing pattern in the codebase and record it under Assumptions in PROGRESS.md.

You are done when every step is done or deferred with evidence, `pnpm verify` passes every check
of PLAN.md step 4.8, and internals/release-1.0/REPORT.md is written as PLAN.md step 4.9 describes.
```

## 3. Checking in during the run

- Progress: `internals/release-1.0/PROGRESS.md` on the branch.
- Ask Opus to review a finished phase: "Review phase N of release/1.0 against
  internals/release-1.0/PLAN.md" (diff, key checks rerun, visual pass on the changed charts).
