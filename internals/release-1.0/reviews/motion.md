# Motion review (vccs, branch feat/cell-grid-main, 2026-10-05)

Scope: every animated chart, the engine in `packages/vue/src/animation`, tooltip and active-dot
motion. Read-only review. Medium depth.

Evidence lives in `.evidence/review/motion/`:

| What | Where |
|---|---|
| Full lab run (`report.mjs --prod --check`, all 29 scenarios) | `motion/report/index.html`, `motion/report/report.json`, log `motion/lab-run.log` |
| Probe A–E (reduced motion, entrance interrupt, retarget, reorder, hover) on 23 scenarios, fake clock, every frame | `motion/probe.mjs`, `motion/probe/results.json`, screenshots `motion/probe/*.png`; colour-free rerun for cell charts, funnel, journey in `motion/probe3/` |
| Idle cost: equal-content refresh, pointer at rest | `motion/probe2.mjs`, `motion/probe2/results.json` (second run, rAF wrapped after the fake clock) |
| Interrupted cascade film | `motion/probe2/{heatmap,treemap,calendar}-cascade-*.png` |
| Cell-chart label films | `motion/film/*.png`, `motion/film/_frames/` |
| BarList container height | `motion/probe4.mjs`, `motion/probe4.log` |

Machine load average was 30–60 during all runs; real-clock timings in the lab are therefore
pessimistic (VERIFY.md warns about this). The fake-clock geometry results are not affected.

## Verdict

The motion system is in very good shape. One engine (`useKeyedTransition`) drives every chart,
there is no legacy `Animate` wrapper or `animationBegin/Duration/Easing` API left, reduced motion
is correct everywhere I measured, interruptions continue from what is on screen without a
position jump, and the tooltip glides on a velocity-preserving spring. What stands between this
and "perfect" is a handful of edge cases, not structure:

- **P1** BarList's own height snaps on add/remove/empty, so page content below jumps or is
  overlapped while rows still animate.
- **P2** Any data refresh with equal content replays a 0.5 s no-op animation (every chart),
  fires `animation-start/-end`, and flattens a running cascade entrance.
- **P2** Spring `transition` props lose their overshoot (progress > 1 is clamped to the target).
- **P2** The animation guide documents old timings and an old label behaviour.
- **P3** Cell-chart axis labels snap while cells slide; small token drift; minor engine cleanups.

## 1. Lab result (all scenarios)

Command: `report.mjs --prod --check --out=.evidence/review/motion/report` (production build, fake
clock, every frame), 29 scenarios, **285 transitions, 283 clean, 2 flagged, 0 page errors or Vue
warnings**. `--check` exits 1 because of the two flags.

| Flag | Verdict |
|---|---|
| `journey top8`: `backwards` ×4, `jump +30 % (7 px)`, `overlap 78 px²` on node `/features/web-analytics` | Accepted trade-off (VERIFY.md): the re-ranked node folds out of its old slot while its neighbours close the gap; quick, no lasting overlap. Video `motion/report/journey/top8.mp4` (not watched by me; judged from the flag numbers and VERIFY.md). |
| `journey top15`: `jump +62 % (15 px)`, `+55 % (14 px)`, `overlap 83 px²` on the same node | Same trade-off in reverse. |

My verdict: both are the known, accepted fold; no new defect. Not a lab false alarm, but not a
defect worth more complexity either.

Other observations from the run and my probes:

- Probe flags that were **my-metric artefacts**, not defects: cell charts (tracker/heatmap/
  calendar "jumps" of 25–4385) were colour digits in `style.fill`; the colour-free rerun
  (`probe3`) shows 0. Funnel labels "jumping" 94 px: my probe ignored component keys; labels are
  keyed by item (`components/label/LabelListView.tsx:65`) and the lab, which reads component
  keys, is clean.
- Journey `values`/`refill`: a node rect moves 84 px in one frame at opacity 0.02→0.16
  (`probe3`). Below the lab's 0.35 "faint" threshold, barely visible; P3 at most.
- Real-clock timing: no repeated slow frames at 1×; with CPU 4× slower the worst single frames
  were 33 ms in `barMany` (182 bars, 4 slow frames per step) and isolated 50–183 ms frames in
  `areaStacked fromOne`, `calendar narrow/wide`, `scatter shift`. The machine load average was
  50–70 during the run, so these are not trustworthy; rerun on a quiet machine before acting.
- Not covered by the lab (hence my probes): reduced motion, re-order of categorical charts,
  interruption during an entrance, equal-content refresh, axis/label motion, HTML list height.

## 2. Per chart

Legend: ok = measured and looked right; issue = see finding; n/a = the chart has no such change.
"Interrupt" = data changed 300 ms into the entrance (probe B) and 160 ms into an update with a
reversal (probe C, plus the lab's `interrupt` step). Jump metric: largest one-frame step of any
shape number as a share of its total travel; a clean ease-out start is ≈ 0.05–0.27, a jump is
≈ 1. Reduced motion: page emulates `prefers-reduced-motion: reduce`; "0/0" means no shape
attribute (axes included) changed after the first frame of the entrance and after the second
frame of an update.

| Chart | Entrance | Update | Add/remove | Re-order | Resize | Interrupt | Hover/tooltip | Reduced |
|---|---|---|---|---|---|---|---|---|
| Bar (vert., horiz., stacked, negative) | ok, 1 s cubic grow from baseline | ok | ok, neighbours slide, no overlap | ok (reverse rows: share 0.14) | ok, snaps by design | ok (0.07 / 0.08) | ok, spring tooltip, no shape moves | 0/0 |
| Line, monotone | ok, length-based draw 1.2–2 s | ok | ok, grow out of / fold into neighbour | ok | ok, draw keeps progress | ok (0.05 / 0.08) | ok | 0/0 |
| Area, stacked | ok, sweep | ok | ok, folds onto baseline, null gaps kept | ok | ok | ok (0.06 / 0.17) | ok | 0/0 |
| Composed | ok; line draw ends ≈ 0.2 s after bars (P3-4) | ok | ok | ok | ok | ok | ok | 0/0 |
| Scatter | ok, symbols grow | ok | ok, 0.3 s exit | ok | ok | ok | ok | 0/0 |
| Pie, donut | ok, one sweep | ok | ok, sectors open from neighbour edge | ok (0.24) | ok | ok | ok | 0/0 |
| Radar | ok, grows from centre | ok | ok | ok | ok | ok | ok | 0/0 |
| RadialBar | ok | ok | ok, 0.3 s exit | ok | ok | ok | ok | 0/0 |
| Funnel | ok | ok | ok, seams | ok (layout sorted; no move) | ok | ok (probe flag was a label-identity artefact, see 1) | ok | 0/0 |
| Treemap | ok, diagonal cascade 1.2 s | ok | ok | n/a (sorted layout) | ok | cascade flattens if interrupted (P2-1) | ok | 0/0 |
| Sankey | ok | ok | ok | ok | ok | ok | ok | 0/0 |
| Sunburst | ok, sweep from `startAngle` | ok | ok | n/a | ok | ok | ok | 0/0 |
| Heatmap | ok, diagonal cascade | ok, colour 300 ms CSS | ok, row folds along seam | ok (xOrder cross-fades in place) | ok | cascade flattens (P2-1) | ok, dim 150 ms | 0/0 |
| Cohort | ok | ok | rows slide; row labels snap (P3-1) | n/a | ok | ok | ok | 0/0 |
| Calendar | ok | ok | ok, conveyor through clip | n/a | ok (narrow/wide) | cascade flattens (P2-1) | ok | 0/0 |
| Tracker | ok, slide-in cascade | ok, colour | ok, conveyor | n/a | ok | ok | ok, dim | 0/0 |
| JourneySankey | ok, cascade | ok | ok; re-rank folds a node (accepted) | ok | ok | ok (faint node, see 1) | ok, 150 ms highlight | 0/0 |
| BarList | ok | ok, numbers count along | **container height snaps (P1-1)** | ok, crossing rows dim | ok | ok | n/a | 0/0 |
| Sparkline (line/area/bar) | ok, draw | ok | ok | n/a | ok | ok | ok | 0/0 |
| Tooltip | fade 120 ms + scale 0.96 | glides on spring 500/40, keeps velocity | — | — | — | retargets mid-glide without restart | — | fade only, position jumps (correct) |
| Active dot | r and opacity 0→1 in 150 ms | snaps to next point (like Recharts) | — | — | — | — | — | no animation |

Frames looked at: `probe/*-hover.png`, `probe/*-reorder-end.png`, `probe2/heatmap-cascade-*.png`,
`film/heatmap__02-dropDay.png`, `film/_frames/heatmap/02-dropDay-005.png`,
`film/_frames/heatmap/04-xOrder-010.png`, `film/cohort__02-nextMonth.png`. I did not watch the lab's mp4 videos (no video viewer here); the lab's numeric flags cover them, and the owner should still watch `report/index.html` at 1× once.

Probe B/C numbers (share of travel in the largest single frame; ≤ 0.27 everywhere except the
artefacts explained in section 1): bar 0.07/0.08, barHorizontal 0.08/0.08, line 0.05/0.08,
area 0.06/0.17, scatter 0.07/0.08, pie 0.07/0.15, radar 0.08/0.08, radial 0.13/0.15,
treemap 0.07/0.08, sankey 0.08/0.08, sunburst 0.14/0.15, sparkline 0.09/0.17, barList 0.05/0.08.

Idle cost (probe2): with the pointer at rest and no data change, 0 animation frames in every
chart. Pointer moving between categories: ≈ 38 frames (the tooltip spring), nothing else moves.

## 3. Consistency

One family, with small drift.

- **One engine.** Every chart animates through `useKeyedTransition` (Bar, Scatter, Funnel, Pie,
  Radar, RadialBar, Treemap, Sankey, Sunburst, CellGridLayer → Heatmap/Cohort/Calendar/Tracker,
  JourneySankey, BarList) or `usePointTransition` (Line, Area, Sparkline), and axes/grids through
  `useTickMotion`. No `Animate` wrapper, no `animationBegin/Duration/Easing` anywhere in `src`
  (grep). Every series takes the same `transition?: ChartTransition` prop and `isAnimationActive`
  (default `true` everywhere).
- **Tokens.** Entrance 1 s easeOutCubic, cascade 1.2 s (spread 0.4) easeOutCubic, update 0.5 s
  easeOutQuint, exit 0.3 s for separate shapes. Charts marked `connected` (Bar, Funnel, Pie,
  Radar, Sankey, Sunburst, cell charts, Journey, lines, axes) use 0.5 s for exits too, by design
  ("they move with their neighbours"). Scatter, RadialBar, Treemap and BarList exit in 0.3 s.
- **Deliberate deviations (keep):** line/area/sparkline draw with `drawTiming` (1.2–2 s,
  ease-in-out `0.4,0,0.2,1`); cascades; Tracker's slide-in.
- **Untokenised micro-timings** (P3-2): Tooltip fade 0.12/0.1 s and spring 500/40
  (`components/Tooltip.tsx:280,329`), ActiveDot 0.15 s `'easeOut'` (`animation/ActiveDot.tsx:21`),
  cell dim `opacity 150ms ease-out` and colour `fill 300ms ease-out`
  (`chart/CellGridLayer.tsx:450`), journey highlight `opacity 150ms ease-out`
  (`chart/JourneySankey.tsx:360`). Values are fine and consistent with each other; they just live
  in five places.
- **Type drift:** Tooltip's `transition` is `AnimationOptions` (`Tooltip.tsx:242,572`), every
  series uses `ChartTransition`; Treemap and Scatter spell it `ValueAnimationTransition<number>`
  (same type, different name).
- **Duplicated cascade reveal:** Treemap (`chart/Treemap.tsx:204-215`) re-implements
  CellGridLayer's `revealOf` cascade (`chart/CellGridLayer.tsx:140-158`) with the same 4 % / 92 % /
  opacity 0 numbers.

## 4. Engine quality

**Correctness (good).** Keyed matching with stable duplicate suffixes, exits kept in place
between their staying neighbours (paths never cross back), neighbour-aware enter/exit, one linear
clock with per-phase curves, entrance continuation on the same curve (`continueTiming`), resize
and brush-drag snapping, in-view and measured-size gating, SSR/hydration start state. Lab and
probes found no position jump in any interruption.

Risks found:

1. No equality short-circuit (P2-1). The watch source at `useKeyedTransition.ts:238` returns a
   fresh object, and nothing compares the new target with what is drawn. Probe2: replacing the
   data with an equal copy costs 32 animation frames (0.5 s) in all 17 charts tested, re-renders
   every frame, and emits `animation-start`/`animation-end`. During a cascade entrance the same
   path drops the per-item turns (`turn` is built only when `first`, line 315), so cells that had
   not started yet all fade in together (film `probe2/heatmap-cascade-after-6f.png` vs
   `heatmap-cascade-uninterrupted-0490ms.png`).
2. Spring overshoot clipped (P2-2). `render` maps `t >= 1` to `to` (line 340), and the user
   transition path feeds raw spring progress (line 355). A bouncy spring therefore rises, sits
   flat at the target while it should overshoot, then dips below and returns. The docs advertise
   springs (`docs/content/2.guides/12.animation.md:42`).
3. Two clocks (P3-3). Entrance continuation reads `performance.now()` (lines 318, 324) while
   progress comes from motion-v's frame loop. They diverge when rAF is throttled (background tab):
   a change then gets update timing instead of continuing the entrance. No jump, just a different
   pace; low risk.
4. `snap()` emits `onStart`/`onEnd` on every snap (line 157-160), including every frame of a
   resize. Recharts only emits around real animations (P3-5).

**Per-frame cost.** Per animated series and frame: one new `DisplayItem[]` plus one interpolated
object per item (spreads of the full item, including `payload`), then consumer passes: Bar copies
again (`BarRectangles.tsx:116`), usePointTransition runs `points`/`stable`/`baselinePoints`/
`reveal` (4 O(n) passes) before the path string is rebuilt. Every frame re-renders the whole
series component (shallowRef of the array). That is fine for normal chart sizes, and the lab's
`barMany`/`lineMany` timings (section 1) stay within budget; the cheap wins are: skip
`interpolate` when `from` and `to` are equal (return `to`), and BarList's
`target.value.findIndex` inside the row loop (`chart/BarList.tsx:120`) is O(n²) per frame.

**Testability (good).** `useKeyedTransition.spec.ts` drives a mocked `animate` clock and covers
cascade, near-end continuation, keyed insert, exits, interruption, duplicates, linear-time
planning of 50 000 items. Gaps: no test for equal-content refresh, spring overshoot, interrupted
cascade, BarList height. The lab's "ideal" curve still assumes a 600 ms quint entrance
(`test/lab/report.mjs:43`), not the 1 s cubic token, so entrance curves in the report are drawn
against the wrong reference (P3-6). The lab excludes axes, grid, labels and HTML list height from
its geometry, which is why P1-1 and P3-1 are invisible to it.

## 5. Findings

### P0
None.

### P1-1 BarList height snaps while its rows animate
`chart/BarList.tsx:110` computes `height` from the target row count. Probe4 (`probe4.log`):
on `remove` the list is 176 px from the first frame while rows still reach 207 px; on `add` it is
212 px while rows reach 181 px; on `empty` it is 0 px while six rows fade out for 0.3 s on top of
whatever follows the list. On a dashboard the content below jumps 36 px per row at once, then
the rows catch up. The lab hides this with its fixed 252 px frame.
Fix: derive the height from the drawn items on the same clock, e.g.
`Σ items (rowHeight + gap) × presence − gap`, where presence is `progress` for `enter`,
`1 − progress` for `exit`, 1 otherwise (or interpolate a `height` field carried by the items).
Add one lab assertion: list height equals the extent of visible rows on every frame.

### P2-1 Equal-content refresh replays a no-op animation and flattens cascades
`animation/useKeyedTransition.ts:238-378`. Fix: after `plan`, if there are no `enter`/`exit`
steps and every `update` step has `from` equal to `to` (shallow compare of own numeric/string
fields, or an optional `equals` option per consumer), settle without `animate`, `onStart` or
`onEnd`. While an entrance runs, keep the cascade: carry `turn` (and its start time) across a
continuation instead of building it only for `first` (line 315), so unstarted items keep their
delay. Regression tests: equal refresh → no new run; refresh at 300 ms of a cascade → an item
with order 1 is still at progress 0.

### P2-2 Spring transitions cannot overshoot
`animation/useKeyedTransition.ts:340,355`. Fix: in the user-transition path pass `t` unclamped to
`interpolate` (clamp only opacity-like fields in consumers, and the `progress` handed to
`labelOpacity`), and settle on `onComplete` only. Test: a spring run with onUpdate 1.1 gives a
value beyond the target.

### P2-3 Animation guide contradicts the code
`docs/content/2.guides/12.animation.md:11-15,30,58`: says entrance 0.6 s; actual 1 s
(cascade 1.2 s, lines 1.2–2 s draw). Says labels "fade in once their series has settled" and
"appear after the transition"; actual labels ride along every frame and fade only with entering or
leaving shapes (`animation/ridingLabels.ts:3-11`). Exit list omits BarList. "Bars, lines and areas
arrive and settle together" is not exact while lines draw longer (P3-4). Fix: regenerate the
table from `motionTokens` and describe riding labels.

### P3-1 Cell-chart axis labels snap
`chart/Heatmap.tsx:199,204`, `chart/CalendarHeatmap.tsx:187,192` (Cohort uses Heatmap). Row and
column labels jump to their new place on the first frame while cells slide for 0.5 s
(`film/_frames/heatmap/02-dropDay-005.png`, `film/cohort__02-nextMonth.png`: "Feb · 937" sits on
the top row while Jan's cells are still there; probe3 cohort label 37 px in one frame). Calendar
month labels are keyed by `text-x`, so on `nextWeek` they remount instead of sliding. Cartesian
axes already solve this with `useTickMotion`. Fix: run the labels through `useKeyedTransition`
with the same tokens (key = label text; month key = month, not x), or position each row label from
its row's drawn cells.

### P3-2 Micro-timings outside the tokens
See section 3. Fix: add `motionTokens.feedback` (0.15 s ease-out: hover dim, active dot, journey
highlight, tooltip fade) and `motionTokens.color` (0.3 s) and read them in the five places; keep
the tooltip spring as `motionTokens.follow`.

### P3-3 Entrance continuation uses a second clock
`animation/useKeyedTransition.ts:318,324`. Fix: read elapsed time from the running animation
(`controls.time`) or track the last `elapsed` from `onUpdate`.

### P3-4 Composed entrances end at different times
Line/area draw (`motion.ts:46-49`) runs 1.2–2 s; bars, scatter 1 s. In a composed chart the line
lands 0.2–1 s after the bars. Either accept and document, or let the series motion registry
(`renderPhase.ts:58`) share the longest entrance duration across a chart's series.

### P3-5 `animation-start/-end` fire on snaps
`animation/useKeyedTransition.ts:154-161`: every resize frame and every reduced-motion change emits
both events. Fix: emit only when a run starts; or document it.

### P3-6 Lab drift
`test/lab/report.mjs:43` ideal entrance = quint 600 ms (token: cubic 1 s); Tracker/heatmap colour
changes and HTML list height are not measured. Fix: import `motionTokens` into the lab's ideal
curves; add container height to `__htmlGeometry`.

### P3-7 Small cleanups
Treemap duplicates the cascade reveal (move `cascadeReveal(cells)` into `motion.ts`);
Tooltip `transition` type `AnimationOptions` vs `ChartTransition`; BarList O(n²)
`findIndex` per frame (`chart/BarList.tsx:120`).

## Excellent, preserve

- One keyed engine for every chart; exits stay in place between staying neighbours; new points
  grow from on-screen neighbours. This is what makes shifts read as a conveyor, not a morph.
- Interruptions start from the screen state; entrance continues on its own curve
  (`continueTiming`) instead of restarting. Measured: no jump in any chart.
- Tooltip spring that keeps velocity across retargets, appears in place (no glide from 0,0), and
  under reduced motion fades without moving.
- Reduced motion: final state within one frame for entrance and updates, axes included, in all
  23 scenarios; CSS colour and highlight transitions are dropped too.
- In-view and measured-size gating: entrances play when the reader can see them, not at load.
- Resize and brush drags follow the box/pointer directly instead of trailing.
- Zero animation frames at rest (probe2 idle = 0 everywhere).
- The lab itself: fake-clock, frame-exact, with a proven-to-fire jump detector.
