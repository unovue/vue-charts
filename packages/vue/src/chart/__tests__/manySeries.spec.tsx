import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Funnel, FunnelChart, Legend, Scatter, ScatterChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

// Each series registration re-queued a chart-wide synchronisation watcher, so charts with many
// series hit Vue's "Maximum recursive updates" guard (25 funnels with a legend in a browser).
// Charts with well over 100 series can still reach it; see the performance guide.
it.each([
  ['funnel', 60],
  ['scatter', 90],
] as const)('mounts and updates %s charts with %i series and a legend', async (kind, count) => {
  mockGetBoundingClientRect({ width: 720, height: 360 })
  const errors = vi.spyOn(console, 'error')
  const warnings = vi.spyOn(console, 'warn')
  const keys = Array.from({ length: count }, (_, j) => `s${j}`)
  const row = (offset: number) => ({ name: 'N0', x: 1, y: 1, ...Object.fromEntries(keys.map((key, j) => [key, j + 1 + offset])) })
  const data = ref([row(0)])
  render(() => kind === 'funnel'
    ? (
        <FunnelChart width={720} height={360}>
          <Legend />
          {keys.map(key => <Funnel key={key} data={data.value} dataKey={key} isAnimationActive={false} />)}
        </FunnelChart>
      )
    : (
        <ScatterChart width={720} height={360}>
          <XAxis dataKey="x" type="number" />
          <YAxis dataKey="y" type="number" />
          <Legend />
          {keys.map(key => <Scatter key={key} data={data.value} dataKey={key} isAnimationActive={false} />)}
        </ScatterChart>
      ))
  await nextTick()
  data.value = [row(1)]
  await nextTick()
  await nextTick()
  const messages = [...errors.mock.calls, ...warnings.mock.calls].map(call => String(call[0]))
  expect(messages.filter(message => /recursive/i.test(message))).toEqual([])
  // Rendering 90 series in JSDOM takes several seconds on a busy or slow runner; this test
  // guards the recursion limit, not speed.
}, 30_000)
