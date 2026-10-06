import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropType } from 'vue'
import type { SyncMethod } from '@/types'
import { createSSRApp, defineComponent, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from '@/index'
import { eventCenter } from '@/utils/events'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const Chart = defineComponent({
  props: { syncId: String, syncMethod: { type: [String, Function] as PropType<SyncMethod>, default: 'index' } },
  setup(props, { slots }) {
    return () => (
      <BarChart width={500} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]} syncId={props.syncId} syncMethod={props.syncMethod}>
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
