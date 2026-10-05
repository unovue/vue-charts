# Correctness investigation — vccs

Investigation only; no library changes or commits. Six confirmed defects and two output-proven candidates that require a behavior decision. Each case has an intentionally failing assertion in the saved specs. Source locations refer to the unchanged checkout.

## Reproduce

Copy the four saved `*.spec.tsx` files in this folder to `packages/vue/src/__repro__/`, then run from `packages/vue`:

```sh
TZ=America/Los_Angeles npx vitest run src/__repro__
TZ=Pacific/Kiritimati npx vitest run src/__repro__
```

Use `-t '<test name>'` to isolate a minimal case. Remove the temporary directory afterward. The crash case is isolated in its own file so a partially mounted Vue app cannot contaminate other cases.

## Confirmed bugs

### B1 — P1: Prototype-named stack IDs crash the chart

- Minimal repro: [stack-id.spec.tsx](stack-id.spec.tsx), `a valid string stackId does not crash the chart`. One data row, two bars, `stackId="constructor"`.
- Observed: render throws `TypeError: acc[item.stackId].push is not a function`. Earlier probes also produced this error for `__proto__` and `toString` (`probe-2.log`).
- Expected: a string stack ID groups the two series and does not crash. The public contract permits string IDs without excluding Object prototype property names.
- Root cause: `packages/vue/src/state/selectors/axisSelectors.ts:494` initializes the accumulator as `{}`; lookup at `:500` reads inherited properties; `:503` calls `.push` on the inherited function/object.
- Suggested direction: use a null-prototype accumulator or a Map for stack groups; preserve all ordinary string and numeric IDs.
- Reference: the same unsafe accumulator exists in [Recharts main](https://raw.githubusercontent.com/recharts/recharts/main/src/state/selectors/axisSelectors.ts) (`combineStackGroups`). This is an inherited correctness defect, not an asserted Vue-only regression. Recharts was inspected, not executed.

### B2 — P2: Duplicate BarList labels report the wrong row index

- Minimal repro: [cell-output.spec.tsx](cell-output.spec.tsx), `duplicate BarList names report the clicked row index` (line 16). Two rows named `A`, values 10 and 5; click the second.
- Observed: callback receives `[{ name: 'A', value: 5 }, 0, MouseEvent]`.
- Expected: index 1 for the second displayed row, alongside its correct payload. This example has identical source and sorted order, so it does not depend on which index convention is chosen.
- Root cause: `packages/vue/src/chart/BarList.tsx:120` uses `findIndex` by name. The transition engine preserves duplicate occurrences, but callback/slot indexing collapses them to the first matching name.
- Suggested direction: retain the target row's occurrence identity/index through transition state instead of finding by label alone. Cover slot `index` as well as row-click.

### B3 — P2: CalendarHeatmap drops the latest day when its value is undefined

- Minimal repro: [cell-output.spec.tsx](cell-output.spec.tsx), `CalendarHeatmap ends at latest dated row even when its value is missing` (line 24). Jan 1 has value 5; Jan 2 has value undefined; omit `end`.
- Observed: final cell is `Thu, Jan 1, 2026: 5`; Jan 2 is absent.
- Expected: final cell is `Fri, Jan 2, 2026` with no value. The `end` prop documentation in `CalendarHeatmap.tsx:38` says its default is the latest day in `data`.
- Root cause: `packages/vue/src/chart/CalendarHeatmap.tsx:74` excludes nonfinite values before retaining the day; `:83` derives latest day from that filtered numeric map rather than all valid dated rows.
- Suggested direction: derive the default range from valid dates independently of whether a numeric value is present. Keep numeric aggregation separate from date presence.

### B4 — P2: A constant large finite Sparkline disappears

- Minimal repro: [edge-output.spec.tsx](edge-output.spec.tsx), `Sparkline renders a constant large finite value at mid-height` (line 9). Width 100, height 40, data `[1e20]`, animation disabled.
- Observed: the line's `d` attribute is `""`.
- Expected: the single finite point is at the center, path `M50,20Z`, as the component's constant-domain padding intends. No value is null or nonfinite.
- Root cause: `packages/vue/src/chart/Sparkline.tsx:95–97` adds/subtracts 1 to widen an equal domain. At 1e20 both operations round back to 1e20. Mapping at `:107` divides 0 by 0; D3's defined predicate then excludes the point.
- Suggested direction: handle equal domains directly with a midpoint mapping, or widen them with a representable relative offset; ensure the resulting span is finite and nonzero.

### B5 — P2: An infinite JourneySankey count corrupts valid paths

- Minimal repro: [edge-output.spec.tsx](edge-output.spec.tsx), `JourneySankey ignores infinite counts instead of corrupting valid paths` (line 16). A valid a→b path with count 10 plus x→y with count Infinity.
- Observed: 10 geometry attributes contain NaN, including `d=M8,NaNC160.88,NaN 219.12,NaN 372,NaN`, `stroke-width=NaN`, `height=NaN`, and `y=NaN`. Both the invalid and otherwise valid path are affected.
- Expected: finite SVG geometry and preservation of the valid path. Ignoring the invalid row is the test's chosen policy; rejecting it explicitly would also prevent the demonstrated invalid output.
- Root cause: `packages/vue/src/chart/journeyUtils.ts:95` only requires `count > 0`, accepting Infinity. At `:140–142` the maximum total becomes Infinity and scale becomes zero; `:161–162` then multiply Infinity by zero. NaN node placement also contaminates link coordinates.
- Suggested direction: require finite positive counts before aggregation; choose explicit handling for aggregate overflow as well.

### B6 — P2: Initial controlled Sparkline selection does not initialize its tooltip

- Minimal repro: [edge-output.spec.tsx](edge-output.spec.tsx), `controlled Sparkline activeIndex shows the corresponding tooltip on mount` (line 24). Data `[10,20,30]`, initial `activeIndex=1`, child Tooltip.
- Observed: active-point circle exists, but tooltip has `visibility: hidden` and empty text. Changing index 1→0→1 shows 10 and then 20; the failure checks the original empty tooltip after proving those controls work.
- Expected: initial selection and a later selection of the same index produce the same tooltip state.
- Root cause: `packages/vue/src/chart/Sparkline.tsx:176–185` watches `active` without `immediate`, so initial controlled state never enters the tooltip interaction store. `setActive` at `:171` also returns early when hovering that same initial index.
- Suggested direction: initialize tooltip state after entry registration, and watch the selected point as well as index so geometry/data changes cannot leave its anchor stale. The stale-anchor extension was not reproduced here.

## Output-proven candidates — expectations remain assumptions

### S1 — provisional P2: Null cohort periods become zero retention

- Repro: [cell-output.spec.tsx](cell-output.spec.tsx), `missing cohort periods stay blank rather than displaying zero retention` (line 9).
- Observed: `[100, null, 25]` renders three cells: 100%, **0%**, 25%. The assertion expecting a missing middle cell fails.
- Assumed expectation: null represents an unknown/missing period rather than a measured zero. The documentation says immature periods are left out, but does not explicitly define null entries; therefore this is not counted as a confirmed contract defect.
- Cause: `packages/vue/src/chart/CohortChart.tsx:63` evaluates `Number(null) === 0`, then `:64–67` retains the row.
- Suggested direction if the assumption is accepted: reject null/undefined before numeric conversion; keep actual numeric zero as measured zero retention.

### S2 — provisional P2: Brush selection becomes invalid after data shrinks

- Repro: [ported-output.spec.tsx](ported-output.spec.tsx), `Brush clamps its selection after data shrinks` (line 25). Five rows and initial range [3,4], replaced with one valid row.
- Observed: initial two bars become zero bars; expected one bar under a clamping policy.
- Assumed expectation: an uncontrolled initial selection is clamped to [0,0] when the data shrinks. This recovery policy is not documented, and the upstream state implementation similarly retains start indexes; this is an output-proven robustness candidate, not a claimed port regression.
- Cause: `packages/vue/src/state/chartData.ts:56–57` retains the old start index while changing end; `:65–66` accepts out-of-bounds ranges. `packages/vue/src/cartesian/brush/hooks/useBrushSetting.ts:25–26` reapplies [3,4] on data replacement. `packages/vue/src/cartesian/brush/hooks/useBrushState.ts:39–40` maps those nonexistent indexes to undefined; `packages/vue/src/state/selectors/barSelectors.ts:452` slices outside the only available row.
- Suggested direction if recovery is desired: normalize the effective range against current data at one state boundary, distinguish parent-controlled values from uncontrolled initial values, and define empty-data behavior.
- Reference: [Recharts chartDataSlice](https://raw.githubusercontent.com/recharts/recharts/main/src/state/chartDataSlice.ts) also preserves the start index when data changes. No live Recharts comparison was run.

## Probed cases that showed no bug

Final saved suite includes passing checks for:

- Function versus property dataKey parity in stacked bars, both horizontal and vertical layouts; negative/mixed-sign values, duplicate categories, and a missing stacked value.
- Equivalent numeric axis expression domains (`dataMin - 10`, `dataMax + 10`) and endpoint functions versus literal [0,30]; `auto` domain smoke check (two visible bars, not exact nice-tick equivalence).
- Reversed numeric-axis bar position mirroring with positive and negative values.
- Brush preserves an in-bounds [1,2] selection across a same-length value replacement.
- Zero-sum Pie and Treemap; zero-flow Sankey: no NaN/Infinity geometry. Sankey's warning about its dropped zero link is expected.
- Calendar local Date/ISO-day aggregation across the March DST boundary under both requested timezones; correct date labels and sums.
- Empty data and width 500→0→500 updates in LineChart, BarChart, Tracker and Heatmap: no nonfinite geometry and no leftover data shapes after clearing.
- Sparse Heatmap string/number category identity; absent coordinate pairs remain blank.
- Rapid sparse→empty→dense Heatmap updates settle on the final four-cell matrix.
- Sparkline tooltip payload updates after replacing data while keeping the hovered index.
- Tooltip syncId with reordered receiver data: index sync selects the receiver's position; value sync selects the matching category and value.
- Unmount during Sparkline animation: animation-start called, animation-end not yet called before unmount; no console errors during the following 1 second and no Vitest unhandled errors.

## Verification and limits

Final checks (all Vitest commands ran inside `packages/vue`):

| Command | Actual result | Log |
| --- | --- | --- |
| `TZ=America/Los_Angeles npx vitest run src/__repro__` | Exit 1; 4 files failed, **8 failed / 21 passed / 29 tests** | [los-angeles-final.log](los-angeles-final.log) |
| `TZ=Pacific/Kiritimati npx vitest run src/__repro__` | Exit 1; 4 files failed, **8 failed / 21 passed / 29 tests** | [kiritimati-final.log](kiritimati-final.log) |
| `npx vitest run src/chart/__tests__/CellCharts.spec.tsx src/chart/__tests__/SparklineBarList.spec.tsx src/chart/__tests__/brushRangeOwnership.spec.tsx src/chart/__tests__/BarChart.spec.tsx` | Exit 0; **4 files / 69 tests passed** | [existing-tests.log](existing-tests.log) |

All eight failures map to B1–B6 and S1–S2; final runs have no extra harness failures. Identical outcomes in both timezones give no evidence of a timezone defect in the tested dates. The final copied specs are byte-identical to those run. Failing repro assertions are intentional; there is no claim that the unchanged library passes this audit.

The brief's 1,240 passing tests are a supplied baseline, not a full-suite result measured in this investigation. Targeted existing tests were run separately. DOM/SVG checks use jsdom and real Vue rendering, not a visual browser inspection; no screenshots were taken. Shared/unshared item tooltips, Legend toggling, Area stacking, cyclic Sankey graphs and arbitrary numeric Date/string X-axis scales were not independently probed in the new specs. This is a bounded investigation, not exhaustive certification.

## Earlier-run anomalies and corrections

- `initial.log`: the BarList callback check used testing-library's wrapper `emitted()` and got undefined; the rerun used the public row-click listener and proved the actual index mismatch. Sparkline's first mouse event targeted its outer group rather than the group owning the handler; correcting it made the data-replacement tooltip probe pass. These initial failures are not additional library bugs.
- `probe-2.log`: 15 failures included cascading testing-library `$el` errors after a prototype stack-ID crash. Isolation and reruns removed those secondary failures.
- `probe-3.log`: two stack geometry probes failed inside the existing helper because a missing-value bar has no shape. Direct queries of actual path/rect shapes corrected the probe; function/property parity passed.
- `los-angeles.log` / `kiritimati.log`: the reversed-axis probe first queried rects although bars use paths, then expected a negative bar's y attribute to be its top (135). Its actual anchor is 265 with a negative height, and reversal mirrors it correctly. Correcting the selector and expected anchor removed that failure.
- No conclusions are drawn from differing run durations or from intermediate failure counts. Final identical specs are rerun under both timezones.

## Final containment check

[cleanup.log](cleanup.log) records `git check-ignore` confirming the report/specs are ignored, an empty `git status --short`, `git diff --exit-code` returning 0, and absence of `packages/vue/src/__repro__`. All four copied specs were compared byte-for-byte before removal. No source files, branches, commits, processes on ports 3011/3012, or exclusion rules were changed.
