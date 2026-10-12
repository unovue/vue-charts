import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropType } from 'vue'
import type { SyncMethod } from '@/types'
import { createSSRApp, defineComponent, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, Brush, Tooltip, XAxis, YAxis } from '@/index'
import { eventCenter } from '@/utils/events'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const Chart = defineComponent({
  props: {
    syncId: String,
    syncMethod: { type: [String, Function] as PropType<SyncMethod>, default: 'index' },
    data: {
      type: Array as PropType<Array<{ name: string, value: number }>>,
      default: () => [{ name: 'A', value: 10 }, { name: 'B', value: 20 }],
    },
  },
  setup(props, { slots }) {
    return () => (
      <BarChart width={500} height={300} data={props.data} syncId={props.syncId} syncMethod={props.syncMethod}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip isAnimationActive={false} />
        <Bar dataKey="value" isAnimationActive={false} v-slots={{ shape: slots.shape }} />
        {slots.default?.()}
      </BarChart>
    )
  },
})

describe('chart synchronization lifetime', () => {
  it.each<SyncMethod>(['index', 'value', (_ticks, data) => data.activeTooltipIndex!])('hovering one chart activates the same index only in its sync group (%s)', async (syncMethod) => {
    const shapes = [vi.fn(props => <rect x={props.x} y={props.y} width={props.width} height={props.height} />), vi.fn(props => <rect x={props.x} y={props.y} width={props.width} height={props.height} />), vi.fn(props => <rect x={props.x} y={props.y} width={props.width} height={props.height} />)]
    const { container } = render(() => (
      <div>
        <Chart syncId="shared" v-slots={{ shape: shapes[0] }} />
        <Chart syncId="shared" syncMethod={syncMethod} v-slots={{ shape: shapes[1] }} />
        <Chart syncId="other" v-slots={{ shape: shapes[2] }} />
      </div>
    ))
    await nextTick()
    await nextTick()
    const renders = shapes.map(shape => shape.mock.calls.length)
    for (const count of renders)
      expect(count).toBeGreaterThanOrEqual(2)
    const charts = container.querySelectorAll('.v-charts-wrapper')
    await fireEvent.mouseMove(charts[0], { clientX: 400, clientY: 150 })
    await nextTick()
    await nextTick()
    const tooltips = container.parentElement!.querySelectorAll('.v-charts-tooltip-wrapper')
    expect(tooltips).toHaveLength(3)
    expect(tooltips[0].querySelector('.v-charts-tooltip-label')?.textContent).toBe('B')
    expect(tooltips[1].querySelector('.v-charts-tooltip-label')?.textContent).toBe('B')
    expect((tooltips[0] as HTMLElement).style.visibility).toBe('visible')
    expect((tooltips[1] as HTMLElement).style.visibility).toBe('visible')
    expect((tooltips[2] as HTMLElement).style.visibility).toBe('hidden')
    expect(shapes.map(shape => shape.mock.calls.length)).toEqual(renders)
  })

  it('does not register global listeners for an unsynchronized chart', async () => {
    const on = vi.spyOn(eventCenter, 'on')
    render(Chart)
    await nextTick()
    await nextTick()
    expect(on).not.toHaveBeenCalled()
  })

  it('unregisters every listener after sync group changes and unmount', async () => {
    const on = vi.spyOn(eventCenter, 'on')
    const off = vi.spyOn(eventCenter, 'off')
    const syncId = ref('first')
    const { unmount } = render(() => <Chart syncId={syncId.value} />)
    await nextTick()
    await nextTick()
    expect(on).toHaveBeenCalled()
    const firstRegistrations = [...on.mock.calls]
    syncId.value = 'second'
    await nextTick()
    await nextTick()
    for (const [event, listener] of firstRegistrations) {
      expect(off.mock.calls.some(call => call[0] === event && call[1] === listener)).toBe(true)
    }
    unmount()
    expect(off.mock.calls).toHaveLength(on.mock.calls.length)
    for (const [event, listener] of on.mock.calls) {
      expect(off.mock.calls.some(call => call[0] === event && call[1] === listener)).toBe(true)
    }
  })

  it('does not register shared listeners while rendering concurrent SSR requests', async () => {
    const on = vi.spyOn(eventCenter, 'on')
    const html = await Promise.all([
      renderToString(createSSRApp(Chart, { syncId: 'shared' })),
      renderToString(createSSRApp(Chart, { syncId: 'shared' })),
    ])
    expect(html.every(markup => markup.includes('v-charts-wrapper'))).toBe(true)
    expect(on).not.toHaveBeenCalled()
  })
})

it.each<{ method: SyncMethod, label: string, value: string }>([
  { method: 'index', label: 'A', value: '100' },
  { method: 'value', label: 'B', value: '200' },
  { method: (ticks, message) => ticks.findIndex(tick => tick.value === message.activeLabel), label: 'B', value: '200' },
])('syncs mismatched datasets using $method', async ({ method, label, value }) => {
  const { container } = render(() => (
    <div>
      <Chart
        syncId="mismatched"
        data={[
          { name: 'A', value: 10 },
          { name: 'B', value: 20 },
          { name: 'C', value: 30 },
        ]}
      />
      <Chart
        syncId="mismatched"
        syncMethod={method}
        data={[
          { name: 'B', value: 200 },
          { name: 'A', value: 100 },
        ]}
      />
    </div>
  ))
  await nextTick()
  await nextTick()
  const source = container.querySelector('.v-charts-wrapper')!
  await fireEvent.mouseMove(source, { clientX: 280, clientY: 150 })
  await nextTick()
  await nextTick()
  const target = container.parentElement!.querySelectorAll<HTMLElement>('.v-charts-tooltip-wrapper')[1]
  expect(target.style.visibility).toBe('visible')
  expect(target.querySelector('.v-charts-tooltip-label')?.textContent).toBe(label)
  expect(target.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe(value)
  if (method !== 'index') {
    await fireEvent.mouseMove(source, { clientX: 423, clientY: 150 })
    await nextTick()
    await nextTick()
    expect(target.style.visibility).toBe('hidden')
  }
})

it('syncs a Brush range only to charts in the same group', async () => {
  const data = [10, 20, 30, 40, 50].map(value => ({ value }))
  const { container } = render(() => (
    <div>
      {['range', 'range', 'other'].map((syncId, index) => (
        <BarChart key={index} width={500} height={300} data={data} syncId={syncId}>
          <Bar dataKey="value" isAnimationActive={false} />
          <Brush x={0} y={0} width={405} height={40} />
        </BarChart>
      ))}
    </div>
  ))
  await nextTick()
  await nextTick()
  const charts = [...container.querySelectorAll('.v-charts-wrapper')]
  const start = charts[0].querySelector('[role="slider"]')!
  await fireEvent.focus(start)
  await fireEvent.keyDown(start, { key: 'ArrowRight' })
  await nextTick()
  await nextTick()
  expect(charts.map(chart => chart.querySelectorAll('.v-charts-bar-rectangle').length)).toEqual([4, 4, 5])
  expect(charts.map(chart => chart.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')))
    .toEqual(['1', '1', '0'])
})

it('disposes synchronized chart registrations across repeated mount and unmount', async () => {
  const mounted = ref(true)
  const { container } = render(() => (
    <div>
      <Chart syncId="lifetime" />
      {mounted.value && <Chart syncId="lifetime" />}
    </div>
  ))
  await nextTick()
  await nextTick()
  const source = container.querySelector('.v-charts-wrapper')!
  for (let cycle = 0; cycle < 3; cycle++) {
    mounted.value = false
    await nextTick()
    await nextTick()
    expect(container.parentElement!.querySelectorAll('.v-charts-tooltip-wrapper')).toHaveLength(1)
    mounted.value = true
    await nextTick()
    await nextTick()
    await fireEvent.mouseMove(source, { clientX: cycle % 2 ? 150 : 400, clientY: 150 })
    await nextTick()
    await nextTick()
    const targets = container.parentElement!.querySelectorAll<HTMLElement>('.v-charts-tooltip-wrapper')
    expect(targets).toHaveLength(2)
    expect(targets[1].style.visibility).toBe('visible')
    expect(targets[1].querySelector('.v-charts-tooltip-label')?.textContent).toBe(cycle % 2 ? 'A' : 'B')
    expect(targets[1].querySelector('.v-charts-tooltip-item-value')?.textContent).toBe(cycle % 2 ? '10' : '20')
  }
})
