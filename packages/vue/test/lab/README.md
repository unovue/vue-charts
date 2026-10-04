# Motion lab

A Vite app with one chart per scenario (`?s=bar`, `?s=areaStacked`, `?s=brush`, `?s=stress&type=line&n=10000`…) and a list of data steps per scenario (`window.lab.steps`), plus tools that drive it in a headless browser. Everything runs against `packages/vue/src`.

| Command | What it proves |
|---|---|
| `pnpm motion:report [scenario…] --prod --check` | Every transition, frame-exact: video of every fake-clock animation frame and 4× slow motion, each moving shape's progress against the ideal easing, flags (jumps, reversals, stalls, unsettled shapes), page errors and Vue warnings, and real-clock frame timing at normal speed and with the CPU slowed 4×. Writes `.evidence/motion-report/index.html`. `--check` exits 1 on any flag, error or repeated slow frame. |
| `pnpm motion:film [scenario…] [--steps=a,b] [--every=3]` | Contact sheets of every Nth frame on a fake clock, with numeric flags for pop-in/out, late snaps, path topology changes and NaN attributes. Quick visual review. |
| `pnpm motion:audit [scenario…]` | No chart data in DOM attributes and no React-style attribute names. Exits 1 on any. |
| `pnpm motion:profile <scenario> <step> [backStep] [cpuSlowdown]` | CPU profile of one step in a production build; top self-time functions. |
| `pnpm motion:probe <scenario> <step\|-> "<expression>" [ms]` | The value of a page expression on every animation frame on the real clock (WAAPI fades, springs). |
| `pnpm motion:lab` | Opens the lab app in a dev server for manual review. |

Shared flags: `--browser=chromium|firefox|webkit`, `--prod` (production build; also `LAB_PROD=1`), `--install-browser` (installs the locked Playwright engines). Locally, `MOTION_EXECUTABLE_PATH` can point to another Chromium build, as for `pnpm check:motion`.

Arc shapes (pie, radial and sunburst sectors) are not measured by the progress curves, because their path endpoints move along circles; review them in the videos.

The report advances to each Playwright fake-clock animation frame (16 ms, encoded at 62.5 fps), and uses the actual clock time for curves. This avoids combining two animation frames into one sample when fractional clock advances round up. Before each data or pointer step, it waits for three unchanged geometry frames, up to 2 seconds; failure adds a `did not settle` flag. Entrance is recorded immediately so its motion remains visible. Interrupt resets the data with `fromOne` before settling.

Use `--frames` to also save each transition's geometry as `<scenario>/<step>.frames.json` beside the videos. Run `node --test packages/vue/test/lab/report-metrics.test.mjs` to check that a synthetic one-frame 40 px jump still triggers the jump flag. The jump, backwards, stall, unsettled and overlap thresholds are unchanged.
