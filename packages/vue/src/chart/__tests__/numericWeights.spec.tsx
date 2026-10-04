import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Funnel, FunnelChart, Pie, PieChart, SunburstChart, Treemap } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('numeric hierarchy weights', () => {
  it('renders trimmed numeric strings like numbers while malformed strings stay missing', () => {
    mockGetBoundingClientRect({ width: 600, height: 400 })
    for (const kind of ['Pie', 'Funnel', 'Treemap', 'Sunburst']) {
      const geometry: string[][] = []
      for (const value of [12, ' 12 ']) {
        const data = [{ name: 'A', value }, { name: 'B', value: 24 }, { name: 'missing', value: 'oops' }]
        const view = render(() => {
          if (kind === 'Pie')
            return <PieChart width={600} height={400}><Pie data={data} dataKey="value" isAnimationActive={false} /></PieChart>
          if (kind === 'Funnel')
            return <FunnelChart width={600} height={400}><Funnel data={data} dataKey="value" isAnimationActive={false} /></FunnelChart>
          if (kind === 'Treemap')
            return <Treemap width={600} height={400} data={data} dataKey="value" isAnimationActive={false} />
          return <SunburstChart width={600} height={400} data={{ name: 'root', children: data }} dataKey="value" isAnimationActive={false} />
        })
        const shapes = [...view.container.querySelectorAll('.v-charts-sector, .v-charts-trapezoid, .v-charts-treemap-node rect, .v-charts-sunburst-sector')]
        expect(shapes.length, kind).toBeGreaterThanOrEqual(2)
        expect(view.container.innerHTML, kind).not.toMatch(/NaN|Infinity/)
        geometry.push(shapes.map(el => ['d', 'x', 'y', 'width', 'height'].map(attr => el.getAttribute(attr) ?? '').join('|')))
        view.unmount()
      }
      expect(geometry[1], kind).toEqual(geometry[0])
    }
  })
})
