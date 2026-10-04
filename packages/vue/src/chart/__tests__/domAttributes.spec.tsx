import { fireEvent, render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Area, Bar, ComposedChart, LabelList, Line, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

// Chart data passed between components (payload, dataKey, coordinate…) must never be written
// into the DOM, and React-style names (strokeWidth) must reach SVG as real attributes.
it('writes only valid SVG attributes, never chart data', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const data = [{ name: 'A', a: 10, b: 20 }, { name: 'B', a: 30, b: 15 }]
  const { container } = render(() => (
    <ComposedChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Area dataKey="b" isAnimationActive={false} />
      <Bar dataKey="a" stroke="#000" strokeWidth={2} isAnimationActive={false}><LabelList /></Bar>
      <Line dataKey="b" strokeDasharray="4 2" isAnimationActive={false} />
      <Tooltip />
    </ComposedChart>
  ))
  await nextTick()
  await fireEvent(container.querySelector('.v-charts-wrapper')!, new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 }))
  await nextTick()
  await nextTick()
  const valid = new Set(['viewBox', 'preserveAspectRatio'])
  const bad = [...container.querySelectorAll('*')].flatMap(el => [...el.attributes]
    .filter(a => /\[object |^undefined$|^NaN$/.test(a.value) || (/[A-Z]/.test(a.name) && !valid.has(a.name)))
    .map(a => `${el.tagName} ${a.name}=${a.value.slice(0, 20)}`))
  expect(bad).toEqual([])
  expect(container.querySelector('.v-charts-bar-rectangle path')!.getAttribute('stroke-width')).toBe('2')
})
