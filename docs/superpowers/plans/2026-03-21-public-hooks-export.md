# Public Hooks Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export 13 public hooks (Tooltip, Layout, Axis) so consumers can read chart internal state from custom components inside `<Customized>`.

**Architecture:** Thin wrapper hooks in a new `publicHooks.ts` file that wrap existing Redux selectors via `useAppSelector`. Layout hooks already exist in `chartLayoutContext.tsx` and just need re-export. All hooks return `ComputedRef` values (from `@reduxjs/vue-redux`).

**Tech Stack:** Vue 3 Composition API, Redux Toolkit (`useAppSelector`), existing selectors from `state/selectors/`.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `packages/vue/src/hooks/publicHooks.ts` | Create | New Tooltip + Axis hooks |
| `packages/vue/src/hooks/__tests__/publicHooks.spec.tsx` | Create | Integration tests |
| `packages/vue/src/index.ts` | Modify | Add `export * from './hooks/publicHooks'` + re-export layout hooks |

---

### Task 1: Create Tooltip Hooks

**Files:**
- Create: `packages/vue/src/hooks/publicHooks.ts`
- Test: `packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`

- [ ] **Step 1: Write failing tests for tooltip hooks**

```tsx
// packages/vue/src/hooks/__tests__/publicHooks.spec.tsx
import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { Bar } from '@/cartesian/bar/Bar'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { Tooltip } from '@/components/Tooltip'
import { Customized } from '@/components/Customized'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { assertNotNull } from '@/test/helper'
import {
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  useIsTooltipActive,
} from '../publicHooks'

describe('Tooltip public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 300 },
  ]

  it('useIsTooltipActive returns false initially, true after hover', async () => {
    const results: boolean[] = []

    const Spy = defineComponent({
      setup() {
        const active = useIsTooltipActive()
        return () => <div data-testid="spy" data-active={String(active.value)} />
      },
    })

    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </BarChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    expect(spy.getAttribute('data-active')).toBe('false')

    // Hover chart
    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent(chart, new MouseEvent('mousemove', { clientX: 200, clientY: 150 }))
    await nextTick()
    await nextTick()

    expect(spy.getAttribute('data-active')).toBe('true')
  })

  it('useActiveTooltipLabel returns label after hover', async () => {
    const Spy = defineComponent({
      setup() {
        const label = useActiveTooltipLabel()
        return () => <div data-testid="spy" data-label={label.value ?? ''} />
      },
    })

    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </BarChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    expect(spy.getAttribute('data-label')).toBe('')

    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent(chart, new MouseEvent('mousemove', { clientX: 200, clientY: 150 }))
    await nextTick()
    await nextTick()

    // Should have some label (one of A, B, C)
    const label = spy.getAttribute('data-label')
    expect(['A', 'B', 'C']).toContain(label)
  })

  it('useActiveTooltipCoordinate returns coordinate after hover', async () => {
    const Spy = defineComponent({
      setup() {
        const coord = useActiveTooltipCoordinate()
        return () => (
          <div
            data-testid="spy"
            data-has-coord={String(coord.value != null)}
          />
        )
      },
    })

    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </BarChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    expect(spy.getAttribute('data-has-coord')).toBe('false')

    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent(chart, new MouseEvent('mousemove', { clientX: 200, clientY: 150 }))
    await nextTick()
    await nextTick()

    expect(spy.getAttribute('data-has-coord')).toBe('true')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: FAIL — module `../publicHooks` not found

- [ ] **Step 3: Implement tooltip hooks**

```ts
// packages/vue/src/hooks/publicHooks.ts
import { useAppSelector } from '@/state/hooks'
import { selectActiveLabel, selectActiveTooltipCoordinate, selectIsTooltipActive } from '@/state/selectors/tooltipSelectors'

/**
 * Returns whether the Tooltip is currently active (visible due to user interaction).
 * Must be used inside a chart component (e.g. via `<Customized>`).
 */
export function useIsTooltipActive() {
  return useAppSelector(selectIsTooltipActive)
}

/**
 * Returns the current Tooltip coordinate ({ x, y }), or undefined if no interaction.
 * Must be used inside a chart component (e.g. via `<Customized>`).
 */
export function useActiveTooltipCoordinate() {
  return useAppSelector(selectActiveTooltipCoordinate)
}

/**
 * Returns the label of the currently active tooltip index, or undefined.
 * Must be used inside a chart component (e.g. via `<Customized>`).
 */
export function useActiveTooltipLabel() {
  return useAppSelector(selectActiveLabel)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/vue/src/hooks/publicHooks.ts packages/vue/src/hooks/__tests__/publicHooks.spec.tsx
git commit -m "feat: add tooltip public hooks (useIsTooltipActive, useActiveTooltipCoordinate, useActiveTooltipLabel)"
```

---

### Task 2: Add Layout Hooks (usePlotArea + re-exports)

**Files:**
- Modify: `packages/vue/src/hooks/publicHooks.ts`
- Test: `packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`

Layout hooks `useChartWidth`, `useChartHeight`, `useMargin`, `useOffset` already exist in `chartLayoutContext.tsx`. We re-export them and add a new `usePlotArea` that computes the plot area rectangle from `useOffset`.

- [ ] **Step 1: Write failing test for usePlotArea**

Add to `publicHooks.spec.tsx`:

```tsx
import { usePlotArea } from '../publicHooks'

describe('Layout public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
  ]

  it('usePlotArea returns plot area rectangle', async () => {
    const Spy = defineComponent({
      setup() {
        const plotArea = usePlotArea()
        return () => (
          <div
            data-testid="spy"
            data-x={plotArea.value?.x}
            data-y={plotArea.value?.y}
            data-width={plotArea.value?.width}
            data-height={plotArea.value?.height}
          />
        )
      },
    })

    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </BarChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)

    const x = Number(spy.getAttribute('data-x'))
    const y = Number(spy.getAttribute('data-y'))
    const width = Number(spy.getAttribute('data-width'))
    const height = Number(spy.getAttribute('data-height'))

    // Plot area should be smaller than chart due to axes
    expect(x).toBeGreaterThan(0)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThan(500)
    expect(height).toBeGreaterThan(0)
    expect(height).toBeLessThan(300)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: FAIL — `usePlotArea` not exported

- [ ] **Step 3: Implement usePlotArea and re-exports**

Add to `publicHooks.ts`:

```ts
import { computed } from 'vue'
import { useChartHeight, useChartWidth, useMargin, useOffset } from '@/context/chartLayoutContext'

// Re-export existing layout hooks
export { useChartWidth, useChartHeight, useMargin, useOffset }

/**
 * Returns the plot area rectangle { x, y, width, height }.
 * This is the area inside all axes, legend, and brush — where graphical items render.
 * Must be used inside a chart component (e.g. via `<Customized>`).
 */
export function usePlotArea() {
  const offset = useOffset()
  return computed(() => {
    const o = offset.value
    if (o == null)
      return undefined
    return {
      x: o.left,
      y: o.top,
      width: o.width,
      height: o.height,
    }
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/vue/src/hooks/publicHooks.ts packages/vue/src/hooks/__tests__/publicHooks.spec.tsx
git commit -m "feat: add layout public hooks (usePlotArea + re-export useChartWidth/Height/Margin/Offset)"
```

---

### Task 3: Add Axis Hooks

**Files:**
- Modify: `packages/vue/src/hooks/publicHooks.ts`
- Test: `packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`

Axis hooks need an `axisId` parameter (defaults to `0`). They wrap `selectAxisDomain` and `selectTicksOfAxis` which take `(state, axisType, axisId, isPanorama)`.

- [ ] **Step 1: Write failing tests for axis hooks**

Add to `publicHooks.spec.tsx`:

```tsx
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import {
  useXAxisDomain,
  useXAxisTicks,
  useYAxisDomain,
  useYAxisTicks,
} from '../publicHooks'

describe('Axis public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 300 },
  ]

  it('useXAxisDomain returns categorical domain', async () => {
    const Spy = defineComponent({
      setup() {
        const domain = useXAxisDomain()
        return () => (
          <div data-testid="spy" data-domain={JSON.stringify(domain.value)} />
        )
      },
    })

    const { container } = render(() => (
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </LineChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    const domain = JSON.parse(spy.getAttribute('data-domain')!)
    expect(domain).toEqual(['A', 'B', 'C'])
  })

  it('useYAxisDomain returns numerical domain', async () => {
    const Spy = defineComponent({
      setup() {
        const domain = useYAxisDomain()
        return () => (
          <div data-testid="spy" data-domain={JSON.stringify(domain.value)} />
        )
      },
    })

    const { container } = render(() => (
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </LineChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    const domain = JSON.parse(spy.getAttribute('data-domain')!)
    // Y domain should cover the data range [0 or close, 300 or higher]
    expect(domain).toHaveLength(2)
    expect(domain[0]).toBeLessThanOrEqual(100)
    expect(domain[1]).toBeGreaterThanOrEqual(300)
  })

  it('useXAxisTicks returns tick items', async () => {
    const Spy = defineComponent({
      setup() {
        const ticks = useXAxisTicks()
        return () => (
          <div
            data-testid="spy"
            data-tick-count={ticks.value?.length ?? 0}
          />
        )
      },
    })

    const { container } = render(() => (
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </LineChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    expect(Number(spy.getAttribute('data-tick-count'))).toBe(3)
  })

  it('useYAxisTicks returns tick items', async () => {
    const Spy = defineComponent({
      setup() {
        const ticks = useYAxisTicks()
        return () => (
          <div
            data-testid="spy"
            data-has-ticks={String((ticks.value?.length ?? 0) > 0)}
          />
        )
      },
    })

    const { container } = render(() => (
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="value" isAnimationActive={false} />
        <Customized>
          {{ default: () => <Spy /> }}
        </Customized>
      </LineChart>
    ))

    await nextTick()
    await nextTick()

    const spy = container.querySelector('[data-testid="spy"]')
    assertNotNull(spy)
    expect(spy.getAttribute('data-has-ticks')).toBe('true')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: FAIL — axis hooks not exported

- [ ] **Step 3: Implement axis hooks**

Add to `publicHooks.ts`:

```ts
import type { AxisId } from '@/state/cartesianAxisSlice'
import { selectAxisDomain, selectTicksOfAxis } from '@/state/selectors/axisSelectors'

/**
 * Returns the domain of the specified X axis.
 * @param axisId - Axis ID (default: 0)
 */
export function useXAxisDomain(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisDomain(state, 'xAxis', axisId, false))
}

/**
 * Returns the domain of the specified Y axis.
 * @param axisId - Axis ID (default: 0)
 */
export function useYAxisDomain(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisDomain(state, 'yAxis', axisId, false))
}

/**
 * Returns the computed tick items for the specified X axis.
 * @param axisId - Axis ID (default: 0)
 */
export function useXAxisTicks(axisId: AxisId = 0) {
  return useAppSelector(state => selectTicksOfAxis(state, 'xAxis', axisId, false))
}

/**
 * Returns the computed tick items for the specified Y axis.
 * @param axisId - Axis ID (default: 0)
 */
export function useYAxisTicks(axisId: AxisId = 0) {
  return useAppSelector(state => selectTicksOfAxis(state, 'yAxis', axisId, false))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test packages/vue/src/hooks/__tests__/publicHooks.spec.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/vue/src/hooks/publicHooks.ts packages/vue/src/hooks/__tests__/publicHooks.spec.tsx
git commit -m "feat: add axis public hooks (useXAxisDomain, useYAxisDomain, useXAxisTicks, useYAxisTicks)"
```

---

### Task 4: Export from Public API

**Files:**
- Modify: `packages/vue/src/index.ts`

- [ ] **Step 1: Add export to index.ts**

Add to `packages/vue/src/index.ts`:

```ts
export {
  // Tooltip hooks
  useIsTooltipActive,
  useActiveTooltipCoordinate,
  useActiveTooltipDataPoints,
  useActiveTooltipLabel,
  // Layout hooks
  useChartWidth,
  useChartHeight,
  useMargin,
  useOffset,
  usePlotArea,
  // Axis hooks
  useXAxisDomain,
  useYAxisDomain,
  useXAxisTicks,
  useYAxisTicks,
} from './hooks/publicHooks'
```

Note: `useActiveTooltipDataPoints` is already in `state/hooks.ts`. It should be re-exported from `publicHooks.ts`:

```ts
// In publicHooks.ts, add:
export { useActiveTooltipDataPoints } from '@/state/hooks'
```

- [ ] **Step 2: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds, all hooks appear in dist output

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (no regressions)

- [ ] **Step 4: Commit**

```bash
git add packages/vue/src/index.ts packages/vue/src/hooks/publicHooks.ts
git commit -m "feat: export all public hooks from vccs package API"
```

---

### Task 5: Update TODO Tracking

**Files:**
- Modify: `tasks/todo.md`

- [ ] **Step 1: Mark hooks items as complete in todo.md**

Update section 3 (3.1 Tooltip Hooks, 3.2 Layout Hooks, 3.3 Axis Hooks) — check all boxes and add completion record.

- [ ] **Step 2: Commit**

```bash
git add tasks/todo.md
git commit -m "docs: mark P2 hooks export as complete in todo"
```
