import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { eventCenter } from '@/utils/events'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const Chart = defineComponent({
  props: { syncId: String },
  setup(props) {
    return () => (
      <BarChart width={500} height={300} data={[{ name: 'A', value: 10 }]} syncId={props.syncId}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
    )
  },
})

describe('chart synchronization lifetime', () => {
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
