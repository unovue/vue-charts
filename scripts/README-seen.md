# Visitor-visible chart motion gate

`pnpm check:seen` builds vccs, static docs, then the served playground. It runs
headless Chromium at 1440×900 and 390×844, one page at a time. Set
`MOTION_EXECUTABLE_PATH` to an installed Chromium headless shell when needed.
Playwright is resolved through the existing @nuxt/test-utils installation.
Only ports 4690–4699 are used; servers and browsers are stopped on completion.

Options: `--fixture` runs just the five synthetic controls; `--only=docs|landing|play`
selects a site/scenario; `--route=/charts/area-chart,/bar-charts` filters exact routes (comma list);
`--width=390` selects one width; `--skip-build` uses existing builds.
`--only=docs` includes landing scroll and landing clicks; `--only=landing` runs
only landing clicks. An unmatched route is a failed empty run.

The page uses real-clock `requestAnimationFrame` samples with `performance.now()`
timestamps, starting before hydration. Each wrapper containing an SVG surface
is one chart. Scrolling advances at 600 px/s in real-clock frame steps, pauses
1200 ms when each new chart is half visible,
and ends two seconds after reaching the bottom. Tabs are DOM-clicked in order
Area, Bar, Pie, Radar, Area, with the pointer away throughout each 2500 ms recording.
Radar is selected before the sequence so the first Area click switches charts.
If auto-rotation has already selected the next target, another tab is selected
and settled before recording the requested click. The selection check, recorder
reset and click share one browser task so auto-rotation cannot turn the click
into a no-op. A tab recording without a newly rendered chart is an error.
Only newly mounted wrappers are judged for tab triggers; outgoing and unrelated
charts are excluded. Landing auto-rotation remains enabled, as a visitor would
experience it; additional chart replacements are labeled auto-rotation separately.

- `visibleRatio`: wrapper rectangle intersected with the viewport / wrapper area.
- `effectiveOpacity`: computed opacity multiplied through all ancestors.
- `blurred`: any ancestor blur above 0.3 px, or a transform scale more than
  1 % away from 1. A settled `blur(0px)` does not count.
- `seenAt`: first sample with ratio ≥ 0.5, opacity ≥ 0.95, and no blur/scale.
  Load versus scroll triggers use the recorded scroll position when the chart
  first becomes half-visible.
- Geometry records path data, position, dimensions, radii, points, transforms,
  opacity, dashes, and shape ancestor transforms/opacity/clipping. Hover dot,
  tooltip and cursor subtrees inside the SVG are excluded; host CSS utility
  classes do not exclude plots. Absent attributes are omitted and treated as
  null, keeping long recordings smaller. Shape identity survives updates;
  replaced shapes count as missing. Signatures round numbers to 0.001 to avoid
  subpixel serialization noise, following check:play.
- `motionStart` / `motionEnd`: start and end of the entrance, the longest run
  of changing samples (gaps up to 120 ms). One-frame layout changes at mount,
  while the chart is off screen or hidden, are not part of it.
- `progressAtSeen`: share of the entrance's time that had passed at `seenAt`
  (0–1). `geometryProgressAtSeen` is the same by shape distance, capped at one
  per shape and taken over the final chart's shapes only; informational.
- `seenMotionMs`: max(0, motionEnd − seenAt), or 0 without either timestamp.

Flags use fixed thresholds: `unseen-entrance` for progress > 0.15 or seen motion
< 400 ms (also if never fully seen), only for animated charts that move; `no-entrance` for no geometry changes;
`late-start` for start − seen > 250 ms; `stray-hover` for a painted active dot
or visible tooltip while the pointer is outside the wrapper that is gone again by the
end (a tooltip kept on screen with defaultIndex is intended). Explicitly disabled
Vue series are exempt from `no-entrance` and `unseen-entrance`, using the production VNode traversal
pattern from check:play. Static axes do not cancel that exemption.

Every recording reports its largest sample gap. A gap > 50 ms intersecting
seenAt − 100 through seenAt + 1200 ms marks the row unreliable; unreliable rows
cannot pass the real release gate. The fixture requires exactly charts a–d to
be flagged and chart e to pass, with all five rows reliable. A never-animated
chart necessarily also meets the short-motion unseen threshold.

Evidence is git-ignored in `.evidence/seen/`: raw frames, summary with full sorted
progress and duration distributions, flagged-first HTML, and ten-frame PNG
filmstrips. Filmstrips freeze actual sampled SVG/computed styles and ancestor
opacity/blur and viewport clipping, following check:play's SVG snapshot pattern; they do not reproduce
HTML tooltip chrome or surrounding container backgrounds. Each tile labels both
the requested and actual sample time. A chart never fully seen uses its first
half-visible frame as the evidence anchor. Videos from Playwright recordVideo
show the real interface at 1× for area docs scrolling and landing tab clicks.
Fixture evidence uses `fixture-summary.json` and `fixture-index.html`, preserving
real baseline files. Exit 1 means flags, unreliable sampling, execution errors,
or an empty run; real product failures are expected on the initial baseline.

Legacy check:play and check:docs keep their analysis and default report paths.
Their server ports also use 4690–4699. check:play now accepts the same `--out=`
option as check:docs so the verification reports can live under `.evidence/seen/`.
