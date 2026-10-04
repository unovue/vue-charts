# Motion lab

A Vite app with one chart per scenario (`?s=bar`, `?s=areaStacked`, `?s=brush`, `?s=stress&type=line&n=10000`…) and a list of data steps per scenario (`window.lab.steps`), plus tools that drive it in a headless browser. Everything runs against `packages/vue/src`.

| Command | What it proves |
|---|---|
| `pnpm motion:report [scenario…] --prod --check` | Every transition, frame-exact: 60 fps video and 4× slow motion, each moving shape's progress against the ideal easing, flags (jumps, reversals, stalls, unsettled shapes), page errors and Vue warnings, and real-clock frame timing at normal speed and with the CPU slowed 4×. Writes `.evidence/motion-report/index.html`. `--check` exits 1 on any flag, error or repeated slow frame. |
| `pnpm motion:film [scenario…] [--steps=a,b] [--every=3]` | Contact sheets of every Nth frame on a fake clock, with numeric flags for pop-in/out, late snaps, path topology changes and NaN attributes. Quick visual review. |
| `pnpm motion:audit [scenario…]` | No chart data in DOM attributes and no React-style attribute names. Exits 1 on any. |
| `pnpm motion:profile <scenario> <step> [backStep] [cpuSlowdown]` | CPU profile of one step in a production build; top self-time functions. |
| `pnpm motion:probe <scenario> <step\|-> "<expression>" [ms]` | The value of a page expression on every animation frame on the real clock (WAAPI fades, springs). |
| `pnpm motion:lab` | Opens the lab app in a dev server for manual review. |

Shared flags: `--browser=chromium|firefox|webkit`, `--prod` (production build; also `LAB_PROD=1`), `--install-browser` (installs the locked Playwright engines). Locally, `MOTION_EXECUTABLE_PATH` can point to another Chromium build, as for `pnpm check:motion`.

Arc shapes (pie, radial and sunburst sectors) are not measured by the progress curves, because their path endpoints move along circles; review them in the videos.
