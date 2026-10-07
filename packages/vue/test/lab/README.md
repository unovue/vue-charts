# Motion lab

A Vite app with chart scenarios (`?s=bar`, `?s=areaStacked`, `?s=brush`, `?s=stress&type=line&n=10000`…) and a list of data steps per scenario (`window.lab.steps`), plus tools that drive it in a headless browser. Everything runs against `packages/vue/src`.

The lab has two uses. The **gate** (`pnpm verify --release`, release CI) proves that every transition is smooth; the **instruments** (`pnpm lab <command>`) record what happens so you can debug it. Instruments never fail a release.

| Command | Use | Output |
|---|---|---|
| `node packages/vue/test/lab/report.mjs --prod --check` | Gate: every scenario and step, frame by frame on a fake clock. Exits 1 on unaccepted flags (jumps, reversals, stalls, overlaps, unsettled shapes), stale accepted flags or page errors. No video, no real-clock timing. | `.evidence/motion-report/report.json`, `index.html` (progress curves) |
| `pnpm lab film <scenario…> [--steps=a,b]` | What does this transition look like, frame by frame? | per step: `<step>.mp4` (1×), `<step>-sheet.png` (contact sheet), `<step>-strip.png` (8-frame filmstrip), `<step>.frames.json` in `.evidence/lab/film/<scenario>/` |
| `pnpm lab timing <scenario…> [--steps=a,b]` | Does it drop frames on a real clock, also with the CPU slowed 4×? | `timing` per step in `.evidence/lab/timing/report.json` and `index.html` |
| `pnpm lab seen [route…] [--only=docs\|landing\|play] [--width=390] [--skip-build]` | What does a visitor see when scrolling to a chart or switching landing tabs? | visitor-viewpoint filmstrips, rAF data and videos in `.evidence/lab/seen/index.html` |
| `pnpm lab dev` | Look at a scenario by hand (`?s=bar`). | a Vite dev server |

Every `pnpm lab` run updates `.evidence/lab/manifest.json` and `.evidence/lab/index.html`: one entry per recording with its command, scenario (or page), step, flags and file paths.

Shared flags: `--browser=chromium|firefox|webkit`, `--prod` (production build; also `LAB_PROD=1`). The browser is always headless, because a hidden browser window pauses `requestAnimationFrame`. `VCCS_PORTS=4620-4629` moves the lab server into that port range. `node scripts/lib/browser.mjs --install-browser` installs the locked Playwright engines. Locally, `MOTION_EXECUTABLE_PATH` can point to another Chromium build, as for `pnpm check:motion`. Each scenario has a 10-minute limit (`--scenario-timeout=<ms>`); a scenario that hangs fails with its name and step instead of waiting for an outside kill.

## Debug a motion bug

1. `pnpm lab film <scenario> --steps=<step>` and open the contact sheet with any image viewer (or `Read` it as an agent). The sheet tiles up to 36 evenly spaced frames plus every flagged frame. Each tile is labelled `#<frame> <ms>` on the fake clock (16 ms per frame); a red label and border marks a frame that a flag points to (`@<ms>` in the flag text). Read it left to right, top to bottom: a shape that jumps between two tiles, moves backwards, or ends somewhere else than in the last tile is the bug.
2. Open `<step>.frames.json` for numbers: `{ scenario, step, flags, errors, budget, frames }`. Each frame is `{ t, shapes, overlap }`; `shapes` maps a stable shape identity (`<tag>.<class>#<vnode keys>@<n>`) to its geometry attributes `d|x|y|width|height|cx|cy|r|transform|points|stroke-width`, with `|~faint` when the shape is under 35 % opacity. `frames[0].before` is the geometry before the change. Compare one identity across frames to see exactly when and how far it moved.
3. `pnpm lab timing <scenario>` when the motion is right on the fake clock but stutters in a real browser. Timing depends on machine load; repeat it on a quiet machine before you trust a slow frame.
4. `pnpm lab seen <route>` when the chart animates correctly but a visitor misses the entrance (it runs while the chart is off screen or under a fade).

Cell scenarios: `tracker` starts with 30 ISO-date status rows at 720×36 and exercises
`shift`, `shift3`, `status`, `to14`, `to30`, `empty`, and `refill`. `calendar` starts with
365 deterministic daily values and explicit range bounds, then exercises `values`,
`nextWeek`, `nextYear`, `weekStart`, `narrow`, `wide`, `empty`, and `refill`.
Calendar width follows the frame (720→360→720). Its `empty` step clears values while
retaining the explicit date grid. Color-only changes are visible in films (`pnpm lab film`), but do not
produce geometry progress curves. Cell rects participate in the existing overlap flag
(still named `overlap bars`); it measures raw geometry, including clipped portions.

Arc shapes (pie, radial and sunburst sectors) are not measured by the progress curves, because their path endpoints move along circles; review them in the videos.

The report advances to each Playwright fake-clock animation frame (16 ms, encoded at 62.5 fps), and uses the actual clock time for curves. This avoids combining two animation frames into one sample when fractional clock advances round up. Before each data or pointer step, it waits for three unchanged geometry frames, up to 2 seconds; failure adds a `did not settle` flag. Entrance is recorded immediately so its motion remains visible. Interrupt resets the data with `fromOne` before settling.

Each capture has a budget derived from the independent static target: the longest enter/update/exit token, the bounded cascade token when present, and `drawTiming` for the target line geometry. Curve components supply their point geometry; Sparkline supplies its rendered path length. The budget adds a fixed 100 ms settlement margin and, for interruption, its scheduled 150 ms delay. Item count never extends the cascade duration. The report records these inputs in each row's `budget`; geometry must reach the independent target within that budget. With `--timing`, real-clock timing samples 900 ms. Cut-off and stalled transitions remain failures.

`--frames` saves each transition's geometry as `<scenario>/<step>.frames.json` (`pnpm lab film` sets it). Run `node --test packages/vue/test/lab/report-metrics.test.mjs` to check that a synthetic one-frame 40 px jump still triggers the jump flag. The jump, backwards, stall, unsettled and overlap thresholds are unchanged.

Dashboard scenarios:

- `heatmap`: seven day rows × 24 hour columns at 720×240; `values`, `dropDay`
  (Wednesday), `addDay`, `xOrder` (reverse hours), `empty`, `refill`.
- `cohort`: six triangular monthly cohorts at 720×240; `values`, `nextMonth`
  (drop January, append a period to each retained cohort, add July), `count`, `percent`.
- `sparkline`: line, area and bar side by side at 224×80 each, sharing 30 ISO-date
  keyed points; `shift`, `shift5`, `gap` (one null), `values`, `to10`, `to30`, `empty`, `refill`.
- `barList`: six ranked rows; `rerank`, `add`, `remove`, `values` (same rank),
  `empty`, `refill`. A fixed 252px frame keeps empty/refill recordings visible.

The report collects every SVG surface, prefixing identities only for additional
surfaces. Overlap is measured within each surface's coordinate system. HTML BarList
container height is sampled before each change to catch a synchronous snap. Rows retain their keyed identities and contribute translateY progress; their bars'
percentage widths resolve to pixels for progress and jump thresholds. Films also
capture row opacity. HTML rows do not participate in the SVG overlap metric.
Color-only heatmap/cohort changes are visible in films but have no geometry curves.

Journey scenario: `journey` uses the playground's 15 journeys at 720×480, initially
with four columns and the original counts. `values` changes counts without changing
paths; `top8` keeps the eight largest updated journeys (stable input order breaks ties),
`top15` restores all updated journeys, and `steps3`/`steps4` change column count.
`addJourney` adds a count-three path with a new page in every column;
`removeJourney` removes it, `empty` clears the data, and `refill` restores original counts.
Report and film capture cubic path coordinates and `stroke-width` for stroked bands
(including Sankey links). Journey continue/exit rects participate in the existing
`overlap bars` metric. Hover's 150ms CSS opacity fade is not a geometry transition;
this scenario exercises data and column changes, without pointer steps.

Journey captures use a 560px viewport height so all columns and labels remain visible.
The 480px chart leaves band space after the densest column’s minimum label slots,
including the added journey; a 360px chart would collapse the full layout to zero scale.
