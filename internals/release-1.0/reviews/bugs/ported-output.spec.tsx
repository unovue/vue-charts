import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { nextTick, ref, createApp } from 'vue'
import { Bar, BarChart, Brush, Pie, PieChart, Sankey, Treemap, XAxis, YAxis } from '@/index'
import { getBarRects } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

it.each(['horizontal', 'vertical'] as const)('function dataKey matches property dataKey in %s stacked bars', async layout => {
  const data = [{ name: 'A', a: 10, b: 20 }, { name: 'B', a: -5, b: 10 }, { name: 'B', b: 5 }]
  const geometries: string[][] = []
  for (const fn of [false, true]) {
    const { container, unmount } = render(() => <BarChart width={500} height={300} layout={layout} data={data}><XAxis type={layout === 'vertical' ? 'number' : 'category'} dataKey={layout === 'horizontal' ? 'name' : undefined} /><YAxis type={layout === 'vertical' ? 'category' : 'number'} dataKey={layout === 'vertical' ? 'name' : undefined} /><Bar dataKey={fn ? row => row.a : 'a'} stackId="stack" isAnimationActive={false} /><Bar dataKey={fn ? row => row.b : 'b'} stackId="stack" isAnimationActive={false} /></BarChart>)
    await nextTick()
    await nextTick()
    geometries.push([...container.querySelectorAll('.v-charts-bar-rectangle path, .v-charts-bar-rectangle rect')].map(el => ['x', 'y', 'width', 'height'].map(attr => el.getAttribute(attr)).join('|')))
    unmount()
  }
  console.log('stack geometry', layout, geometries)
  expect(geometries[0].length).toBeGreaterThan(0)
  expect(geometries[1]).toEqual(geometries[0])
})

it('Brush clamps its selection after data shrinks', async () => {
  const data = ref(Array.from({ length: 5 }, (_, i) => ({ name: String(i), value: i + 1 })))
  const { container } = render(() => <BarChart width={500} height={300} data={data.value}><XAxis dataKey="name" /><YAxis /><Bar dataKey="value" isAnimationActive={false} /><Brush startIndex={3} endIndex={4} /></BarChart>)
  await nextTick(); await nextTick()
  expect(getBarRects(container)).toHaveLength(2)
  data.value = [{ name: 'new', value: 10 }]
  await nextTick(); await nextTick()
  console.log('brush after shrink bars', getBarRects(container).length)
  expect(getBarRects(container)).toHaveLength(1)
})

it.each(['Pie', 'Treemap', 'Sankey'])('%s zero-sum inputs produce no nonfinite geometry', async kind => {
  const view = render(() => kind === 'Pie' ? <PieChart width={500} height={300}><Pie data={[{ value: 0 }, { value: 0 }]} dataKey="value" isAnimationActive={false} /></PieChart> : kind === 'Treemap' ? <Treemap width={500} height={300} data={[{ name: 'a', value: 0 }, { name: 'b', value: 0 }]} dataKey="value" isAnimationActive={false} /> : <Sankey width={500} height={300} data={{ nodes: [{ name: 'a' }, { name: 'b' }], links: [{ source: 0, target: 1, value: 0 }] }} isAnimationActive={false} />)
  await nextTick()
  expect(view.container.innerHTML).not.toMatch(/NaN|Infinity/)
})

it.each(['auto', 'expression', 'function'] as const)('axis %s domain renders identical geometry for equivalent bounds', async kind => {
  const geometries: string[][] = []
  for (const custom of [false, true]) {
    const domain = !custom ? [0, 30] : kind === 'auto' ? [0, 'auto'] : kind === 'expression' ? ['dataMin - 10', 'dataMax + 10'] : [(min: number) => min - 10, (max: number) => max + 10]
    const view = render(() => <BarChart width={500} height={300} data={[{ name: 'a', value: 10 }, { name: 'b', value: 20 }]}><XAxis dataKey="name" /><YAxis domain={domain} /><Bar dataKey="value" isAnimationActive={false} /></BarChart>)
    await nextTick(); await nextTick()
    geometries.push(getBarRects(view.container).map(el => ['x','y','width','height'].map(attr => el.getAttribute(attr)).join('|')))
    view.unmount()
  }
  console.log('domain geometry', kind, geometries)
  if (kind !== 'auto') expect(geometries[1]).toEqual(geometries[0])
  else expect(geometries[1].length).toBe(2)
})

it('Brush preserves an in-bounds selection when values update without changing data length', async () => {
  const data = ref(Array.from({ length: 5 }, (_, i) => ({ name: String(i), value: i + 1 })))
  const { container } = render(() => <BarChart width={500} height={300} data={data.value}><XAxis dataKey="name" /><YAxis /><Bar dataKey="value" isAnimationActive={false} /><Brush startIndex={1} endIndex={2} /></BarChart>)
  await nextTick(); await nextTick()
  expect(getBarRects(container)).toHaveLength(2)
  data.value = data.value.map(row => ({ ...row, value: row.value + 10 }))
  await nextTick(); await nextTick()
  console.log('brush same-length update bars', getBarRects(container).length)
  expect(getBarRects(container)).toHaveLength(2)
})
