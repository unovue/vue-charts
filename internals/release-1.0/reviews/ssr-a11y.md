# SSR, hydration and accessibility audit

Audit only, 2026-10-05. Library snapshot: `library/`, source HEAD `72c87650c63c2b23738c2148b159e3d35de92643`; hashes in `library-manifest.json`. No library edits, builds, commits, branches or publication.

## Release assessment

No P0 server throw was observed in 66 cases. Release blockers: reduced-motion hydration mismatches in **Tracker, Heatmap, CohortChart and CalendarHeatmap**; Funnel keyboard errors; inaccessible pointer-only chart data; and server output that does not meet the documented complete-chart promise. Accessibility markup and contrast failures also need correction. The ComposedChart drawing-order difference is an unresolved anomaly; do not use it to conclude release readiness.

## Method and coverage

- Copied the existing dist before importing it. Node/Vite SSR uses `@vue/server-renderer` without browser globals. Browser imports only the copied dist. No rebuild was requested because dist was available and another job could rebuild it.
- 22 targets × 3 SSR sizes = **66** render calls: fixed 560×300, width-less with height 300, and ResponsiveContainer with height 300. Server Vue warning handlers recorded zero warnings; no throws. Individual HTML files and `ssr.json` retain the output.
- **110 final browser cases**: each target at fixed light, fixed dark, fixed reduced motion, width-less at 560px, and ResponsiveContainer at 350px inside a 390px viewport. Dev Vue hydration checks were enabled. Browser sampling: immediately after mount, 180ms, 1.2s, 3.0s, 3.4s. All 110 settled snapshots were stable. All 88 non-reduced cases changed shapes/reveal during the first 1.2s; all 22 reduced cases were stable from 180ms to 1.2s. Reduced-motion initial snapping is allowed, so start→final differences are not called animation.
- axe-core **4.10.3**, Chromium headless shell **1243**, Playwright **1.58.2**. axe ran scoped to the chart host before keyboard interaction and after Left/Right navigation in both themes. Pointer checks cover the six charts with unavailable keyboard tooltips. Table counts are the maximum node count per rule across those states, not cumulative duplicate scans.
- Settled DOM compares hydrated output with a fresh client mount using the same data and animation disabled, before keyboard interaction. Comparison preserves element order, text, shape geometry and styles; it removes SSR comments and per-app IDs/references and normalizes equivalent CSS serialization. `dom-comparison.json` records both trees. All **21/22** canonical DOMs match; ComposedChart has the same geometry set but different series order.
- Light/dark CSS comes from the docs theme tokens and `--v-charts-*` mappings in `docs/app/assets/main.css:1-91`. Text over SVG cells was checked separately with browser-resolved colors converted via canvas into sRGB; dark measurements wait 400ms for theme color transitions. These detect failures axe did not report. No screen-reader certification is claimed.

## Server, hydration and entrance results

“Shapes” counts data shapes, not axes/legend decoration. Presence does not mean visible: entrances can collapse geometry, set opacity to zero, or clip the shape. Tooltip is inactive on SSR; Legend and Brush are static controls, so their own entrance is N/A and their host chart entrance was checked. All fixed charts use 560×300 except BarList, which derives a 104px list height.

| Target | SSR no throw | Server shapes/markup | Dev hydration (normal / reduced) | Console errors | Entrance ≤1.2s | Settled DOM |
| --- | --- | --- | --- | --- | --- | --- |
| BarChart | ok | FAIL: 0 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| LineChart | ok | ok: 1 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| AreaChart | ok | ok: 2 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| ComposedChart | ok | FAIL: partial: 3; bars absent | ok: 0 / ok: 0 | ok: 0 | ok | FAIL: order anomaly |
| PieChart | ok | FAIL: 0 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| RadarChart | ok | ok: 1 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| RadialBarChart | ok | FAIL: 0 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| ScatterChart | ok | ok: 3 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| FunnelChart | ok | FAIL: 0 | ok: 0 / ok: 0 | FAIL: 3 keyboard TypeErrors incl. screenshot replay | ok | ok |
| Treemap | ok | ok: 3 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| Sankey | ok | ok: 5 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| SunburstChart | ok | FAIL: 0 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| Tracker | ok | ok: 3 | ok: 0 / FAIL: 6 style warnings per mount | FAIL: hydration summary (2 mounts) | ok | ok |
| Heatmap | ok | ok: 4 | ok: 0 / FAIL: 8 style warnings per mount | FAIL: hydration summary (2 mounts) | ok | ok |
| CohortChart | ok | ok: 5 | ok: 0 / FAIL: 10 style warnings per mount | FAIL: hydration summary (2 mounts) | ok | ok |
| CalendarHeatmap | ok | ok: 59 | ok: 0 / FAIL: 118 style warnings per mount | FAIL: hydration summary (2 mounts) | ok | ok |
| JourneySankey | ok | ok: 10 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| BarList | ok | ok: 3 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| Sparkline | ok | ok: 1 | ok: 0 / ok: 0 | ok: 0 | ok | ok |
| Tooltip | ok | N/A: inactive overlay; host bars absent | ok: 0 / ok: 0 | ok: 0 | N/A widget; host ok | ok |
| Legend | ok | ok: 1 | ok: 0 / ok: 0 | ok: 0 | N/A widget; host ok | ok |
| Brush | ok | ok: 4 | ok: 0 / ok: 0 | ok: 0 | N/A widget; host ok | ok |

Normal-mode hydration has **zero mismatch warnings for all 22 targets**. Reduced-motion failures occur on the first mount: Tracker **6**, Heatmap **8**, CohortChart **10**, CalendarHeatmap **118** style mismatch warnings; the screenshot reload repeats them, yielding 12/16/20/236 warnings in `browser.json`. No chart throws during SSR. Funnel errors occur after keyboard actions, not while rendering/hydrating.

Exact common mismatch:

```text
[Vue warn]: Hydration style mismatch
- rendered on server: style="opacity:1;transition:fill 300ms ease-out, opacity 150ms ease-out;"
- expected on client: style="opacity:1;"
Hydration completed but contains mismatches.
```

The rect variant includes `fill:...` with the same transition disagreement. Vue warns that this check-only mismatch is not rectified in production. Full warning text and stacks are in `warnings.json` and `browser.json`. Funnel exact error: `TypeError: Cannot read properties of null (reading 'length')` at copied `events/useChartInteractions.mjs:60:33`, traced to source `packages/vue/src/events/useChartInteractions.ts:83` (`tooltipTicks.length`).

Server shape limitations: BarChart, PieChart, RadialBarChart, FunnelChart and SunburstChart contain **no data paths**; ComposedChart omits bars. Line paths start at `stroke-dasharray="0 1"`; Radar and Scatter geometry starts collapsed; BarList bars start at `width:0%`; Sparkline uses a zero-progress clip. Other chart shapes are present in entrance/reveal state. The responsive wrapper also hides server content. See `screenshots/BarChart-server.png`, `PieChart-server.png`, `SunburstChart-server.png`.

## Responsive output and chart-box shift

All measurements are actual bounding boxes before hydration versus settled client boxes; this is a box-size proxy, **not the browser's cumulative layout shift metric**. Container height is deliberately reserved, so no outer size shift was observed in these fixtures. Internal SVG geometry and axis/legend layout do update. This does not establish stability for unreserved-height production layouts.

| Target | Width-less server SVG | Width-less box before → after | Container server SVG | 390px viewport box before → after | Box Δ |
| --- | --- | --- | --- | --- | --- |
| BarChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| LineChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| AreaChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| ComposedChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| PieChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| RadarChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| RadialBarChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| ScatterChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| FunnelChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Treemap | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Sankey | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| SunburstChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Tracker | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Heatmap | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| CohortChart | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| CalendarHeatmap | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| JourneySankey | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| BarList | none | 560×104 (visible) → 560×104 (visible) | none | 350×300 (visible) → 350×300 (visible) | 0,0px / 0,0px |
| Sparkline | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Tooltip | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Legend | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |
| Brush | 640×300 | 560×300 (hidden) → 560×300 (visible) | 640×300 | 350×300 (hidden) → 350×300 (visible) | 0,0px / 0,0px |

The standard width-less server SVG is **640×300** in this fixture, revealed at **560×300** or **350×300** after measurement. Its wrapper already reserves the final box but is `visibility:hidden` on SSR. ResponsiveContainer sends real child markup, not a content-free placeholder. BarList is a native visible UL rather than an SVG and derives height 104px. `useResponsiveSize.ts:42-45` defines the general fallback as 640×360 when neither height nor aspect is given; those fully unspecified dimensions were source-read, not browser-tested here.

## Accessibility by target

Role/name is the effective chart interaction root; specialized charts put it on an inner SVG group. The native BarList role is inferred from UL. Missing chart role/name is a manual finding even when axe returns zero. Generic default names identify the chart type, not the dataset.

| Target | Accessible role / name | Keyboard and arrows | Keyboard tooltip | Focus visibility | Reduced entrance |
| --- | --- | --- | --- | --- | --- |
| BarChart | application / BarChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| LineChart | application / LineChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| AreaChart | application / AreaChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| ComposedChart | application / ComposedChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| PieChart | application / PieChart chart | Focus ok; arrows do not expose item data | FAIL: pointer only in tested chart | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| RadarChart | application / RadarChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| RadialBarChart | application / RadialBarChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| ScatterChart | application / ScatterChart chart | Focus ok; arrows do not expose item data | FAIL: pointer only in tested chart | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| FunnelChart | application / FunnelChart chart | FAIL: ArrowRight/Left throw | FAIL: pointer only in tested chart | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| Treemap | FAIL: no chart role or name | FAIL: no focus target, pointer-only items | FAIL: pointer only in tested chart | N/A (no target) | ok: no measured animation |
| Sankey | FAIL: no chart role or name | FAIL: no focus target, pointer-only items | FAIL: pointer only in tested chart | N/A (no target) | ok: no measured animation |
| SunburstChart | FAIL: no chart role or name | FAIL: no focus target, pointer-only items | FAIL: pointer only in tested chart | N/A (no target) | ok: no measured animation |
| Tracker | listbox / Status history | Tab and arrows select data; tooltip updates | ok | Internal cell ring; outer outline none | No measured animation; FAIL hydration |
| Heatmap | listbox / Heatmap | Tab and arrows select data; tooltip updates | ok | Internal cell ring; outer outline none | No measured animation; FAIL hydration |
| CohortChart | listbox / Cohort retention | Tab and arrows select data; tooltip updates | ok | Internal cell ring; outer outline none | No measured animation; FAIL hydration |
| CalendarHeatmap | listbox / Activity calendar | Home + ArrowDown selects Jan 2; tooltip shows value 5 | ok (Home, ArrowDown) | Internal cell ring; outer outline none | No measured animation; FAIL hydration |
| JourneySankey | group / Journeys of 15 sessions over 3 steps | Tab and arrows select data; tooltip updates | ok | Internal node ring; outer outline none | ok: no measured animation |
| BarList | list (native UL) / no explicit name | Static readable list; no controls in this fixture | N/A: no Tooltip slot support in BarList | N/A (no target) | ok: no measured animation |
| Sparkline | img / Trend: 3 values from 10 to 15 | Tab and arrows select data; tooltip updates | ok | Active point marker; outline explicitly none | ok: no measured animation |
| Tooltip | tooltip / unnamed (data is its content); host application / BarChart chart | Tab and arrows select data; tooltip updates | ok | 2px --v-charts-focus outline, offset 2px | ok: no measured animation |
| Legend | button / Toggle value series; UL list semantics fail | Tab + Enter activation ok; arrows delegated to chart | ok | Chromium default outline on controls | ok: no measured animation |
| Brush | 2 sliders / Min value: Alpha, Max value: Gamma | Tab to both sliders; start ArrowRight 65→307.5; end ArrowRight stays at boundary 550 | ok | Chromium default outline on controls | ok: no measured animation |

Calendar's initial selected empty date did not show a tooltip; the focused follow-up selected **Jan 2, value 5**, using Home then ArrowDown, and showed the tooltip and internal focus ring. This is supported behavior, not a keyboard-access failure. Tooltip reduced-motion movement snaps: after ArrowRight all four sampled positions were **(340, 243.375)** at 0/16/180/680ms, with no intermediate movement (`focused.json`).

Legend Tab/Enter activation was exercised. Its default button markup does not expose a pressed/hidden state. Brush's first handle moves from aria-valuenow 65 to 307.5 with ArrowRight; the end handle was tested at its right boundary (550). Both can be focused, but the labels are identical range descriptions and aria-valuenow is a pixel coordinate with no declared min/max/value text (source `TravellerLayer.tsx:53-57`).

## axe violations and text contrast

Cell ratios are normal small text against the filled cell/bar, not the page behind it. These are fixture-specific colors: arbitrary user palettes still require their own check. Tick colors use docs tokens; SVG contrast and text alternatives are not fully covered by axe.

| Target | Light axe rule/impact/count | Dark axe rule/impact/count | Light text contrast | Dark text contrast |
| --- | --- | --- | --- | --- |
| BarChart | aria-allowed-role/minor/1; list/serious/1 | aria-allowed-role/minor/1; list/serious/1 | ok: axis labels ≥4.83:1 | ok: axis labels ≥7.24:1 |
| LineChart | aria-allowed-role/minor/1; list/serious/1; color-contrast/serious/2 | aria-allowed-role/minor/1; list/serious/1; color-contrast/serious/2 | FAIL: 4.15:1 | FAIL: 4.46:1 |
| AreaChart | aria-allowed-role/minor/1; list/serious/1; color-contrast/serious/2 | aria-allowed-role/minor/1; list/serious/1; color-contrast/serious/2 | FAIL: 4.15:1 | FAIL: 4.46:1 |
| ComposedChart | aria-allowed-role/minor/3; list/serious/1; color-contrast/serious/4 | aria-allowed-role/minor/3; list/serious/1; color-contrast/serious/4 | FAIL: 4.15:1 | FAIL: 4.46:1 |
| PieChart | color-contrast/serious/2 | ok: 0 | FAIL: 3.94:1 | No axe text contrast violation (hover tooltip) |
| RadarChart | color-contrast/serious/2 | ok: 0 | FAIL: 3.94:1 | ok: axis labels ≥7.24:1 |
| RadialBarChart | color-contrast/serious/2 | ok: 0 | FAIL: 3.94:1 | No axe text contrast violation in tested visible state |
| ScatterChart | ok: 0 | ok: 0 | ok: axis labels ≥4.83:1 | ok: axis labels ≥7.24:1 |
| FunnelChart | color-contrast/serious/2 | ok: 0 | FAIL: 3.94:1 | No axe text contrast violation (hover tooltip) |
| Treemap | color-contrast/serious/2 | ok: 0 | FAIL 1.98:1 (cell/bar text) | ok 5.89:1 (cell/bar text) |
| Sankey | color-contrast/serious/2 | ok: 0 | FAIL: 3.52:1 | No axe text contrast violation (hover tooltip) |
| SunburstChart | color-contrast/serious/2 | color-contrast/serious/2 | FAIL: 4.15:1 | FAIL: 4.46:1 |
| Tracker | ok: 0 | ok: 0 | No axe text contrast violation in tested visible state | No axe text contrast violation in tested visible state |
| Heatmap | ok: 0 | ok: 0 | FAIL 2.22:1 (cell/bar text) | FAIL 2.60:1 (cell/bar text) |
| CohortChart | ok: 0 | ok: 0 | FAIL 2.22:1 (cell/bar text) | FAIL 2.42:1 (cell/bar text) |
| CalendarHeatmap | ok: 0 | ok: 0 | No axe text contrast violation in tested visible state | No axe text contrast violation in tested visible state |
| JourneySankey | ok: 0 | ok: 0 | No axe text contrast violation in tested visible state | No axe text contrast violation in tested visible state |
| BarList | ok: 0 | ok: 0 | FAIL 3.45:1 (cell/bar text) | ok 4.92:1 (cell/bar text) |
| Sparkline | ok: 0 | color-contrast/serious/1 | No axe text contrast violation in tested visible state | FAIL: 3.58:1 |
| Tooltip | aria-allowed-role/minor/1; list/serious/1 | aria-allowed-role/minor/1; list/serious/1 | ok: axis labels ≥4.83:1 | ok: axis labels ≥7.24:1 |
| Legend | aria-allowed-role/minor/1; list/serious/1 | aria-allowed-role/minor/1; list/serious/1 | ok: axis labels ≥4.83:1 | ok: axis labels ≥7.24:1 |
| Brush | aria-allowed-role/minor/1; list/serious/1 | aria-allowed-role/minor/1; list/serious/1 | ok: axis labels ≥4.83:1 | ok: axis labels ≥7.24:1 |

Detailed axe failing HTML, selectors and failure summaries are retained in `browser.json` and `pointer-a11y.json`. Computed text colors and axis/tooltip background ratios are in `browser.json`; actual cell-color sRGB values and ratios are in `contrast-cells.json`. Tooltip uses series colors for its text: Line/Area blue is 4.15:1 on white and 4.46:1 on docs dark; Radar/RadialBar gray is 3.94:1 on white; Sparkline blue is 3.58:1 on dark.

## Ranked findings

| Priority | Finding | Trace / evidence |
| --- | --- | --- |
| P0 | None observed. 66/66 server render calls succeed without browser globals. | `ssr.json` |
| P1 | Reduced-motion SSR/client styles disagree for Tracker, Heatmap, CohortChart, CalendarHeatmap. Any hydration mismatch is P1 by the brief. No measured geometry animation does not negate the hydration failure. | `packages/vue/src/chart/CellGridLayer.tsx:186,450,493,500`; server cannot know matchMedia preference; `warnings.json`; reduced screenshots |
| P1 | Funnel keyboard arrows throw on a null tick list. Root advertises application role and is focusable but cannot supply keyboard data. | `packages/vue/src/events/useChartInteractions.ts:67,83`; `FunnelChart-fixed-light-motion-900.png`; full error in `browser.json` |
| P1 | Keyboard cannot reach Pie/Scatter item tooltips. Treemap/Sankey/Sunburst have no chart role/name or focus target; pointer-only chart information is unavailable through the tested keyboard interface. | `packages/vue/src/events/useChartInteractions.ts:67-92` (axis-only path); `chart/Treemap.tsx:497-508`, `chart/Sankey.tsx:386-395,437`, `chart/SunburstChart.tsx:247-251,271-280`; `ChartsWrapper.tsx:17,165-168`; screenshots and pointer/keyboard evidence |
| P1 | Server data shapes absent in Bar/Pie/RadialBar/Funnel/Sunburst and partial in Composed; responsive server charts are invisible. This fails the docs' complete visible SSR-chart claim. | `packages/vue/src/animation/useKeyedTransition.ts:245-251`; `hooks/useResponsiveSize.ts:67-69`; `docs/content/2.guides/11.nuxt-and-ssr.md:8,48`; server screenshots |
| P2 | Default Legend turns LI into button directly inside UL: axe list/serious and aria-allowed-role/minor. Also no aria-pressed state for a toggled item. | `packages/vue/src/components/legend/Legend.tsx:85-103`; `browser.json`; legend screenshot |
| P2 | Text contrast failures in cell values, Treemap/BarList labels, and default tooltip series text. axe misses SVG/cell failures. | `packages/vue/src/chart/CellGridLayer.tsx:509`, `chart/Heatmap.tsx:174`, `chart/Treemap.tsx:394`, `components/Tooltip.tsx:197,218`, `chart/BarList.tsx:145-146`; contrast table and screenshots |
| P2 | Brush slider announcements use pixel coordinates, identical range labels, and omitted range/value text. Arrow interaction works but accessible numeric meaning is weak. | `packages/vue/src/cartesian/brush/components/TravellerLayer.tsx:35-38,53-57`; `supplement.json` |
| P2 | ComposedChart settled drawing order differs from animation-disabled baseline; geometry and text agree. Unresolved anomaly, not a release conclusion. | `packages/vue/src/hooks/useLayerTeleport.ts:5-11` (append-style Teleport target, no order contract); `cartesian/area/Area.tsx:67-68`, `cartesian/bar/Bar.tsx:143`; `focused.json`, `ComposedChart-order-comparison.png` |
| P3 | SSR/animation docs and renderPhase comment are stale: no entrance replay and complete visible server output are claimed while tests/code explicitly require entrance-start SSR. | `docs/content/2.guides/11.nuxt-and-ssr.md:8,48`; `12.animation.md:33`; `packages/vue/src/animation/renderPhase.ts:93-99`; `chart/__tests__/ssrEntrance.spec.tsx:49-54` |

## Anomalies and corrected audit artifacts

1. **4 charts** mismatch only under reduced motion despite the shared responsive-size documentation promising matching first render. High-confidence cause: CellGridLayer reads matchMedia on the client while SSR defaults to transitions. The four exact per-mount warning counts are 6/8/10/118.
2. **1 chart (Composed)** has hydrated order Bar→Area→Line versus settled client baseline Area→Bar→Line. Independently reproduced in the focused single-page check. Geometry-set equality and text equality both hold; append order of teleported series is the likely cause (medium confidence). Do not infer correctness or release status from this anomaly.
3. **5 chart types** have zero server data paths and responsive SVGs are hidden, contradicting the docs' visible complete SSR guarantee and renderPhase comment. High-confidence explanation: useKeyedTransition deliberately sends entrance start; existing SSR tests pass because they assert the same behavior.
4. axe reports **zero violations** for Heatmap/Cohort/Treemap/BarList in the sampled states while independent contrast measurements find failures. Expected: correctly accessible visible text needs adequate contrast. Explanation: axe did not evaluate these SVG/overlay color relationships fully (high confidence); absence of axe violations is not an accessibility pass.
5. Earlier raw snapshot comparisons flagged CSS formatting (e.g. `opacity:1` vs `opacity: 1`) as unequal. Canonical DOM comparison clears these for **21 targets**. They are audit comparison artifacts, not library defects.
6. Setup dependency optimization produced temporary HTTP 504 errors; shared inline-module HTML routes produced invalid concurrent page configurations. Both were corrected before the final results. A missing UTF-8 charset then produced `Â·` text in Cohort and Journey; corrected fixture and reruns removed every normal-mode text mismatch. Archived `setup-browser.*`, `routing-browser.*`, `pre-charset-*` are superseded evidence and must not be counted as library failures.
7. Initial cell color parsing did not support OKLab, and immediate theme switching sampled colors in transition. Those ratios were replaced with canvas color conversion and a 400ms settling wait. `supplement.json` cell ratio fields and `transient-contrast-cells.json` are superseded; use `contrast-cells.json` only.

## Exact checks and real output

| Command / tool | Actual result |
| --- | --- |
| git check-ignore .evidence/review/ssr-a11y/evidence.md .evidence/review/ssr-a11y/screenshots/Heatmap-contrast-dark.png | Both paths printed; ignored |
| node .evidence/review/ssr-a11y/server.mjs | Audit fixture http://127.0.0.1:4607; SSR cases 66 |
| node .evidence/review/ssr-a11y/audit.mjs | Completed 110 cases; charset artifacts were then superseded by the 25-case rerun below. Combined final results: 0 normal-mode mismatches, 4 reduced-motion mismatch charts, 22/22 reduced samples without continued animation, 110/110 stable. |
| AUDIT_ONLY=CohortChart,JourneySankey,Tracker,Heatmap,CalendarHeatmap node .evidence/review/ssr-a11y/audit.mjs | 25 replacement cases; Unicode mismatches cleared; reduced styles still mismatch |
| node .evidence/review/ssr-a11y/supplement.mjs; AUDIT_ONLY=CohortChart,JourneySankey node .evidence/review/ssr-a11y/supplement.mjs | All 22 targets; keyboard controls exercised; text matches baseline for every target |
| node .evidence/review/ssr-a11y/analyze.mjs | 21/22 canonical settled DOMs match; Composed order mismatch only |
| node .evidence/review/ssr-a11y/contrast-cells.mjs | 8 settled light/dark probes; ratios in contrast-cells.json |
| node .evidence/review/ssr-a11y/focused.mjs | Calendar Jan 2 value 5 reachable; reduced Tooltip position constant; Composed order difference reproduced; server screenshots saved |
| node .evidence/review/ssr-a11y/pointer-a11y.mjs; AUDIT_ONLY=SunburstChart node .evidence/review/ssr-a11y/pointer-a11y.mjs | 10 hover/axe probes completed initially; Sunburst bounding-box center was in its ring hole and hover timed out. Actual-point rerun completed the other 2. Final 12/12 tooltips visible; exact results in pointer-a11y.json. |
| pnpm exec vitest run packages/vue/src/chart/__tests__/ssrEntrance.spec.tsx packages/vue/src/chart/__tests__/accessibility.spec.tsx | Test Files 2 passed (2); Tests 14 passed (14); Duration 43.60s. These test current source, not copied dist. |

Logs: `server.log`, `browser.log`, `charset-rerun.log`, `supplement.log`, `charset-supplement.log`, `contrast-cells.log`, `focused.log`, `pointer-a11y.log`, `tests.log`, `analysis.log`. Scripts and HTML are reproducible audit artifacts; no audit artifacts are committed.

## Assumptions and limits

- Small deterministic non-empty data is representative of baseline rendering. This is every listed component, not every possible prop, series permutation, custom slot, empty/invalid dataset, nested drilldown, or docs/playground route. The fixture follows the documented child-series pattern (including Funnel data on its series).
- Fixed dimensions and reserved container height isolate hydration and prevent unrelated page layout changes. Wider/default fully unspecified-height layouts need a separate product-layout check; the box proxy is not a whole-page CLS result.
- For polar/item charts, tested keyboard keys include focus, Left/Right and the follow-up navigation specified above; manual source reading supports the axis-only limitation. VoiceOver/NVDA and accessibility-tree behavior were not tested. Native list content does not need a focus target; BarList had no row action or href in this fixture.
- Legend and Brush are exercised inside BarChart; their own entrance is N/A. Tooltip is tested through actual visible data and reduced-motion movement, not through an artificial active server overlay.
- The docs CSS token mapping is one concrete theme. No claim is made that all user-supplied palettes pass or fail. Initial utility feature-flag warnings in 85 retained ASCII cases are fixture warnings, not hydration mismatches; exact text is retained in browser.json. Corrected reruns and focused checks set Vue feature flags and have no such warnings.
- Scope is an audit of the copied distribution, with source traces at the recorded HEAD. No rebuild or whole-library typecheck was run; typechecking does not establish hydration/accessibility behavior. Another concurrent job can change live dist, so release verification must use a new snapshot after fixes.
- All authored scripts, report, logs, HTML, JSON and screenshots are under the already git-ignored evidence directory. No ignore changes were needed. Installed dependency/tool caches were reused. Process cleanup and final git status are recorded in cleanup.log.
