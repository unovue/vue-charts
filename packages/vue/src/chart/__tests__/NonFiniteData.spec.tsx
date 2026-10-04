import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import * as Charts from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('keeps finite geometry and rows when numeric data contains non-finite values', async () => {
  mockGetBoundingClientRect({ width: 600, height: 400 })
  const variants = ['Line', 'Area', 'AreaStacked', 'Bar', 'BarStacked', 'BarVertical', 'Composed', 'Scatter', 'Radar', 'RadialBar', 'Pie', 'PieDonut', 'Funnel', 'Treemap', 'Sunburst'] as const
  for (const kind of variants) {
    for (const bad of [Infinity, -Infinity, NaN]) {
      const rows = [{ name: 'A', value: bad as number | null, x: 1, z: bad as number | null }, { name: 'B', value: 24, x: 2, z: 24 }]
      const draw = (data: typeof rows) => {
        const size = { width: 600, height: 400 }
        const series = { dataKey: 'value', isAnimationActive: false }
        if (kind === 'Treemap')
          return h(Charts.Treemap, { ...size, ...series, data })
        if (kind === 'Sunburst')
          return h(Charts.SunburstChart, { ...size, ...series, data: { name: 'root', children: data } })
        if (kind === 'Funnel')
          return h(Charts.FunnelChart, size, () => h(Charts.Funnel, { ...series, data }))
        if (kind === 'Pie' || kind === 'PieDonut')
          return h(Charts.PieChart, size, () => h(Charts.Pie, { ...series, data, minAngle: 5, paddingAngle: 2, innerRadius: kind === 'PieDonut' ? 60 : 0 }))
        if (kind === 'Radar')
          return h(Charts.RadarChart, { ...size, data }, () => [h(Charts.Radar, series), h(Charts.PolarAngleAxis, { dataKey: 'name' }), h(Charts.PolarRadiusAxis)])
        if (kind === 'RadialBar')
          return h(Charts.RadialBarChart, { ...size, data }, () => [h(Charts.RadialBar, series), h(Charts.PolarAngleAxis, { dataKey: 'value', type: 'number' }), h(Charts.PolarRadiusAxis, { dataKey: 'name', type: 'category' })])
        const vertical = kind === 'BarVertical'
        const stacked = kind.endsWith('Stacked')
        const Component = kind === 'Composed' ? Charts.ComposedChart : kind === 'Scatter' ? Charts.ScatterChart : kind.startsWith('Bar') ? Charts.BarChart : kind.startsWith('Area') ? Charts.AreaChart : Charts.LineChart
        const Series = kind.startsWith('Bar') ? Charts.Bar : kind.startsWith('Area') ? Charts.Area : kind === 'Scatter' ? Charts.Scatter : Charts.Line
        const seriesProps = { ...series, ...(stacked ? { stackId: 'stack' } : {}), ...(kind === 'Scatter' ? { data } : {}) }
        return h(Component, { ...size, data, layout: vertical ? 'vertical' : 'horizontal' }, () => [
          h(Charts.XAxis, { dataKey: kind === 'Scatter' ? 'x' : vertical ? undefined : 'name', type: kind === 'Scatter' || vertical ? 'number' : 'category' }),
          h(Charts.YAxis, { type: vertical ? 'category' : 'number', dataKey: kind === 'Scatter' ? 'value' : vertical ? 'name' : undefined }),
          ...(kind === 'Scatter' ? [h(Charts.ZAxis, { dataKey: 'z' })] : []),
          h(Series, seriesProps),
          ...(stacked ? [h(Series, seriesProps)] : []),
          ...(kind === 'Composed' ? [h(Charts.Area, seriesProps), h(Charts.Bar, seriesProps)] : []),
        ])
      }
      const { container, unmount } = render(() => draw(rows))
      await nextTick()
      await nextTick()
      for (const element of container.querySelectorAll('svg, svg *')) {
        for (const attribute of element.attributes) {
          expect(attribute.value, `${kind} ${bad}: ${attribute.name}`).not.toMatch(/NaN|Infinity/)
        }
      }
      const shapes = '.v-charts-line-curve, .v-charts-line-dot, .v-charts-area-area, .v-charts-area-dot, .v-charts-bar-rectangle, .v-charts-scatter-symbol, .v-charts-radar-polygon, .v-charts-sector, .v-charts-treemap-node, .v-charts-sunburst-sector, .v-charts-trapezoid'
      const geometry = Array.from(container.querySelectorAll(shapes), element => element.outerHTML)
      expect(geometry.length, `${kind} ${bad}: finite row remains`).toBeGreaterThan(0)
      unmount()
      const control = render(() => draw([{ ...rows[0], value: null, z: null }, rows[1]]))
      await nextTick()
      await nextTick()
      const controlGeometry = Array.from(control.container.querySelectorAll(shapes), element => element.outerHTML)
      expect(geometry, `${kind} ${bad}: same geometry as missing value`).toEqual(controlGeometry)
      control.unmount()
    }
  }
}, 30000)
