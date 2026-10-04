import { render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { Area, AreaChart, Bar, BarChart, Customized, Funnel, FunnelChart, Line, LineChart, Pie, PieChart, PolarAngleAxis, Radar, RadarChart, RadialBar, RadialBarChart, Scatter, ScatterChart, Tooltip, XAxis, YAxis, useIsTooltipActive } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

// Replace only the frame clock; all component and transition logic stays real.
const clock = vi.hoisted(() => ({ runs: [] as Array<{ to: number, onUpdate: (value: number) => void, onComplete?: () => void, stopped: boolean }> }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (_from: number, to: number, options: { onUpdate: (value: number) => void, onComplete?: () => void }) => {
    const run = { to, ...options, stopped: false }
    clock.runs.push(run)
    return { stop: () => { run.stopped = true } }
  },
}))
afterEach(() => { clock.runs = [] })

const Probe = defineComponent({
  setup() {
    const active = useIsTooltipActive()
    return () => <text data-testid="tooltip-state" data-active={String(active.value)} />
  },
})

const data = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }, { name: 'C', value: 30 }]
const families = [
  { name: 'Bar', Chart: BarChart, Item: Bar, selector: '.v-charts-bar-rectangle', props: {} },
  { name: 'Line', Chart: LineChart, Item: Line, selector: '.v-charts-line-dot', props: {} },
  { name: 'Area', Chart: AreaChart, Item: Area, selector: '.v-charts-area-dot', props: { dot: true } },
  { name: 'Pie', Chart: PieChart, Item: Pie, selector: '.v-charts-pie > g', props: { data } },
  { name: 'Scatter', Chart: ScatterChart, Item: Scatter, selector: '.v-charts-scatter-symbol', props: { data } },
  { name: 'Radar', Chart: RadarChart, Item: Radar, selector: '.v-charts-radar-dots circle', props: { dot: true } },
  { name: 'RadialBar', Chart: RadialBarChart, Item: RadialBar, selector: '.v-charts-radial-bar > .v-charts-sector', props: {} },
  { name: 'Funnel', Chart: FunnelChart, Item: Funnel, selector: '.v-charts-funnel > g', props: { data } },
]

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

describe('graphical item emits', () => {
  // Catches native event fallthrough, missing entry/index, and lost tooltip activation.
  it.each(families)('$name delivers item payloads once and preserves tooltip hover', async ({ Chart, Item, selector, props }) => {
    const click = vi.fn()
    const enter = vi.fn()
    const leave = vi.fn()
    const { container } = render(() => (
      <Chart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <PolarAngleAxis dataKey="name" />
        <Tooltip />
        <Customized>{{ default: () => <Probe /> }}</Customized>
        <Item {...props} dataKey="value" isAnimationActive={false} onClick={click} onMouseenter={enter} onMouseleave={leave} />
      </Chart>
    ))
    await nextTick()
    const target = container.querySelectorAll(selector)[1]!
    expect(target).not.toBeNull()
    // Point shapes have a wrapper that also covers custom dot slots.
    const owner = target.tagName.toLowerCase() === 'circle' ? target.parentElement! : target
    const event = new MouseEvent('mouseenter')
    owner.dispatchEvent(event)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter.mock.calls[0]).toEqual([expect.objectContaining({ payload: expect.objectContaining({ name: 'B' }) }), 1, event])
    container.querySelector('.v-charts-wrapper')!.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    await nextTick()
    expect(container.querySelector('[data-testid="tooltip-state"]')?.getAttribute('data-active')).toBe('true')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    target.dispatchEvent(clickEvent)
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.calls[0]).toEqual([expect.objectContaining({ payload: expect.objectContaining({ name: 'B' }) }), 1, clickEvent])
    const leaveEvent = new MouseEvent('mouseleave')
    owner.dispatchEvent(leaveEvent)
    expect(leave.mock.calls[0]).toEqual([expect.objectContaining({ payload: expect.objectContaining({ name: 'B' }) }), 1, leaveEvent])
    expect(leave).toHaveBeenCalledTimes(1)
  })
})

// Keep the real lifecycle; only the animation frame clock is controlled.
it.each(families)('$name emits animation callbacks without payload', async ({ Chart, Item, props }) => {
  const start = vi.fn()
  const end = vi.fn()
  const { unmount } = render(() => (
    <Chart width={500} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <PolarAngleAxis dataKey="name" />
      <Item {...props} dataKey="value" onAnimationStart={start} onAnimationEnd={end} />
    </Chart>
  ))
  await nextTick()
  await nextTick()
  expect(start).toHaveBeenCalled()
  expect(end).not.toHaveBeenCalled()
  for (const run of clock.runs.splice(0)) {
    if (!run.stopped) {
      run.onUpdate(run.to)
      run.onComplete?.()
    }
  }
  await nextTick()
  await nextTick()
  expect(end).toHaveBeenCalled()
  expect(start.mock.calls.every(args => args.length === 0)).toBe(true)
  expect(end.mock.calls.every(args => args.length === 0)).toBe(true)
  const endCount = end.mock.calls.length
  unmount()
  expect(end).toHaveBeenCalledTimes(endCount)
})

it.each([
  { name: 'Line', Chart: LineChart, Item: Line, selector: '.v-charts-line-curve' },
  { name: 'Area', Chart: AreaChart, Item: Area, selector: '.v-charts-area-area' },
  { name: 'Radar', Chart: RadarChart, Item: Radar, selector: '.v-charts-radar-polygon path' },
])('$name emits clicks on its main geometry when dots are disabled', async ({ Chart, Item, selector }) => {
  const click = vi.fn()
  const { container } = render(() => (
    <Chart width={500} height={300} data={data}>
      <Item dataKey="value" dot={false} isAnimationActive={false} onClick={click} />
    </Chart>
  ))
  await nextTick()
  const shape = container.querySelector(selector)!
  expect(shape).not.toBeNull()
  const event = new MouseEvent('click', { bubbles: true })
  shape.dispatchEvent(event)
  expect(click.mock.calls).toEqual([[expect.objectContaining({ payload: expect.objectContaining({ name: 'A' }) }), 0, event]])
})
