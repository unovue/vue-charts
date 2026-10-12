import 'vitest-canvas-mock'
import { expect, it, vi } from 'vitest'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { CalendarHeatmap, CohortChart, Heatmap, Tracker } from '@/index'

// Catches server/client transition mismatches and transitions left on reduced-motion cells.
it.each([
  ['Tracker', () => <Tracker data={[{ value: 10 }, { value: 20 }]} width={500} height={60} isAnimationActive={false} />],
  ['Heatmap', () => <Heatmap data={[{ x: 'A', y: 'B', value: 10 }]} width={500} height={300} isAnimationActive={false} />],
  ['CohortChart', () => <CohortChart data={[{ cohort: 'A', values: [100, 50] }]} width={500} height={300} isAnimationActive={false} />],
  ['CalendarHeatmap', () => <CalendarHeatmap data={[{ date: '2026-01-01', value: 10 }]} start="2026-01-01" end="2026-01-02" width={500} height={150} isAnimationActive={false} />],
])('%s hydrates before applying reduced motion', async (_, render) => {
  // A real Node server has no matchMedia; the hydrating browser reports reduce.
  vi.stubGlobal('matchMedia', undefined)
  const html = await renderToString(createSSRApp({ render }))
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  expect(container.querySelectorAll('.v-charts-cell-grid [style*="transition"]')).not.toHaveLength(0)
  vi.stubGlobal('matchMedia', (media: string) => Object.assign(new EventTarget(), {
    matches: media === '(prefers-reduced-motion: reduce)',
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
  const warn = vi.spyOn(console, 'warn')
  const error = vi.spyOn(console, 'error')
  const app = createSSRApp({ render })
  try {
    app.mount(container)
    await nextTick()
    expect([...warn.mock.calls, ...error.mock.calls]
      .filter(args => String(args[0]).includes('Hydration'))).toEqual([])
    expect(container.querySelectorAll('.v-charts-cell-grid [style*="transition"]')).toHaveLength(0)
  }
  finally {
    app.unmount()
    container.remove()
  }
})
