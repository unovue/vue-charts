import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Area, Bar, Brush, ComposedChart, ErrorBar, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { MockResizeObserver } from '@/test/MockResizeObserver'

it('renders chart part classes with the v-charts- prefix and kebab-case suffixes', async () => {
  mockGetBoundingClientRect({ width: 800, height: 400 })
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  const data = [
    { name: 'A', area: 10, bar: 20, line: 30, error: 2 },
    { name: 'B', area: 20, bar: 30, line: 40, error: 3 },
    { name: 'C', area: 30, bar: 40, line: 50, error: 4 },
  ]
  const { baseElement } = render(() => (
    <ResponsiveContainer width={800} height={400}>
      <ComposedChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Area dataKey="area" dot isAnimationActive={false} />
        <Bar dataKey="bar" isAnimationActive={false}>
          {{ default: () => <ErrorBar dataKey="error" /> }}
        </Bar>
        <Line dataKey="line" isAnimationActive={false} />
        <Brush dataKey="name" alwaysShowText />
        <Legend position="insideBottomRight" />
        <Tooltip defaultIndex={0} />
        <ReferenceLine y={25} />
      </ComposedChart>
    </ResponsiveContainer>
  ))
  await nextTick()
  await nextTick()
  await nextTick()

  const chartClasses = Array.from(baseElement.querySelectorAll('[class]'))
    .flatMap(element => Array.from(element.classList))
    .filter(token => /charts-/.test(token))
  expect(chartClasses.length).toBeGreaterThan(0)
  expect(chartClasses.filter(token => !token.startsWith('v-charts-') || !/^v-charts-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token))).toEqual([])
  // Ensure hidden or unmounted parts cannot make the naming assertion pass vacuously.
  for (const part of ['responsive-container', 'surface', 'area', 'area-dot', 'bar', 'line', 'brush', 'brush-texts', 'brush-traveller', 'brush-slide', 'legend-wrapper', 'tooltip-content', 'error-bar', 'reference-line']) {
    expect(chartClasses).toContain(`v-charts-${part}`)
  }
})
