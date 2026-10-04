# Motion consumer check

Run `pnpm check:motion` from the repository root. It builds the workspace library
and this plain Vite/Vue consumer, selects a free localhost port in 4600–4699,
checks all scenarios in headless Chromium, and closes the browser/server.

The runner uses `playwright-core` from the existing locked `@nuxt/test-utils`
dependency. Install its matching shell with:

```sh
node scripts/check-motion.mjs --install-browser
```

This is equivalent to `playwright-core install --with-deps chromium-headless-shell`
using that dependency's CLI. CI lets Playwright select its installed executable.
An existing local shell can be selected with `MOTION_EXECUTABLE_PATH=/absolute/path`.
No Nuxt application runs in this check.

Results and failure screenshots go to `.evidence/s21/`. That directory must be
ignored by Git. If needed, add `.evidence/` to `.git/info/exclude` before running.
CI uploads the evidence even when a check fails.

The fixture uses development Vue diagnostics in a built Vite app so warnings and
VNode keys remain observable. It imports `vccs` from `packages/vue/dist/es/index.mjs`.
A fixture-only module wraps the real `motion-v` `useSpring` export to observe
persistent motion values; it does not replace animation behavior.

Each scenario measures 800ms after a deterministic data change: at least 42
frames, no intervals over 34ms except one up to 50ms, no Vue warnings/page errors,
and zero recreated DOM elements for retained data keys. DOM nodes receive unique
marker properties and are compared by object identity on every sampled frame.
Expected element counts prevent empty or incomplete selectors from passing.
Line and stacked Area transition from 90 days to 7 and back, with path endpoints
sampled around 80, 160, and 240ms. Upper edges must have increasing x coordinates;
filled-area baselines run in reverse and must have decreasing x coordinates.

The hover sweep dispatches bubbling mouse events through the real chart handler.
It spies on page-level `getBoundingClientRect`/`offsetWidth` calls, records all reads,
and rejects layout reads during the sweep. Tooltip reads are also reported
separately so chart-wrapper pointer-coordinate reads can be distinguished. The
current tooltip has two scalar springs (x and y): one persistent position spring
pair. The horizontal sweep must keep exactly one scalar spring running. The check rejects
extra/recreated springs and requires visible movement.

Performance is an environment-sensitive regression signal, not a universal FPS
claim. The runner never retries to hide a failed measurement. Failure evidence
belongs in the supervisor review; do not modify library source to make it pass.
