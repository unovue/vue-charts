import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Bar, ComposedChart, Line, Pie, PieChart, SunburstChart, Treemap } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const blue = 'var(--v-charts-series-1, var(--v-charts-series, #2563eb))'
const orange = 'var(--v-charts-series-2, var(--v-charts-series, #f97316))'
const teal = 'var(--v-charts-series-3, var(--v-charts-series, #14b8a6))'

describe('default series colors', () => {
  beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 400 }))

  it('assigns series colors in registration order, including explicit colors', async () => {
    const { container } = render(() => (
      <ComposedChart width={500} height={400} data={[{ a: 3, b: 2 }, { a: 4, b: 3 }]}>
        <Line dataKey="a" isAnimationActive={false} />
        <Line dataKey="b" isAnimationActive={false} />
        <Line dataKey="a" stroke="#123456" isAnimationActive={false} />
        <Bar dataKey="b" isAnimationActive={false} />
      </ComposedChart>
    ))
    await nextTick()
    await nextTick()
    expect(Array.from(container.querySelectorAll('.v-charts-line-curve')).map(path => path.getAttribute('stroke')))
      .toEqual([blue, orange, '#123456'])
    expect(container.querySelector('.v-charts-bar-rectangle path')?.getAttribute('fill'))
      .toBe('var(--v-charts-series-4, var(--v-charts-series, #a855f7))')
  })

  it('cycles pie entry colors through the palette', () => {
    const data = Array.from({ length: 9 }, (_, index) => ({ name: String(index), value: 1 }))
    const { container } = render(() => (
      <PieChart width={500} height={400}>
        <Pie data={data} dataKey="value" isAnimationActive={false} />
      </PieChart>
    ))
    const fills = Array.from(container.querySelectorAll('.v-charts-pie .v-charts-sector')).map(path => path.getAttribute('fill'))
    expect(fills).toEqual([
      blue,
      orange,
      teal,
      'var(--v-charts-series-4, var(--v-charts-series, #a855f7))',
      'var(--v-charts-series-5, var(--v-charts-series, #f59e0b))',
      'var(--v-charts-series-6, var(--v-charts-series, #ec4899))',
      'var(--v-charts-series-7, var(--v-charts-series, #06b6d4))',
      'var(--v-charts-series-8, var(--v-charts-series, #84cc16))',
      blue,
    ])
  })

  it('colors Treemap groups by entry order and contrasts default labels after sorting', async () => {
    mockGetBoundingClientRect({ width: 30, height: 14 }, false)
    const { container } = render(() => (
      <Treemap
        width={500}
        height={400}
        dataKey="value"
        isAnimationActive={false}
        data={[{ name: 'small', value: 1 }, { name: 'large', value: 10 }]}
      />
    ))
    await nextTick()
    expect(Array.from(container.querySelectorAll('.v-charts-treemap-node rect')).map(rect => rect.getAttribute('fill')))
      .toEqual([orange, blue])
    expect(Array.from(container.querySelectorAll('.v-charts-treemap-node text')).map(text => text.getAttribute('fill')))
      .toEqual(['var(--v-charts-label-foreground, #0a0a0a)', 'var(--v-charts-label-foreground, #ffffff)'])
  })

  it('inherits Sunburst branch colors through descendants after layout sorting', () => {
    const { container } = render(() => (
      <SunburstChart
        width={500}
        height={400}
        isAnimationActive={false}
        data={{ name: 'root', children: [
          { name: 'small', children: [{ name: 'leaf', value: 1 }] },
          { name: 'large', value: 10 },
        ] }}
      />
    ))
    const fills = Array.from(container.querySelectorAll('.v-charts-sunburst-sector path')).map(path => path.getAttribute('fill'))
    expect(fills).toEqual([orange, blue, blue])
  })
})
