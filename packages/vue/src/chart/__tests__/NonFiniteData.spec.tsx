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

// A null or empty-string value is a missing value, as it is for Sparkline and the cartesian charts; it must not read as 0.
it.each([null, ''])('treats a %o value as missing in the standalone charts', async (blank) => {
  const read = (container: Element) => [
    ...Array.from(container.querySelectorAll('[aria-label]'), element => element.getAttribute('aria-label')),
    container.textContent,
  ]
  const draws = {
    Heatmap: (value: unknown) => h(Charts.Heatmap, { width: 300, height: 100, showValues: true, data: [{ x: 'A', y: 'r', value }, { x: 'C', y: 'r', value: 4 }] }),
    CalendarHeatmap: (value: unknown) => h(Charts.CalendarHeatmap, { start: '2026-01-01', end: '2026-01-03', data: [{ date: '2026-01-01', value }, { date: '2026-01-02', value: 4 }] }),
    BarList: (value: unknown) => h(Charts.BarList, { data: [{ name: 'n', value }, { name: 'f', value: 4 }] }),
    JourneySankey: (value: unknown) => h(Charts.JourneySankey, { width: 300, height: 200, data: [{ path: ['a', 'b'], count: value }, { path: ['a', 'c'], count: 4 }] }),
    CohortChart: (value: unknown) => h(Charts.CohortChart, { width: 300, height: 100, mode: 'percent', data: [{ cohort: 'Jan', values: [value, 3] }, { cohort: 'Feb', values: [4, 2] }] }),
  }
  for (const [name, draw] of Object.entries(draws)) {
    const blankRender = render(() => draw(blank))
    await nextTick()
    const actual = read(blankRender.container)
    blankRender.unmount()
    const missingRender = render(() => draw(undefined))
    await nextTick()
    expect(actual, name).toEqual(read(missingRender.container))
    if (name === 'CohortChart')
      expect(missingRender.container.textContent?.match(/%/g), 'only the Feb cohort, which has a size, shows percentages').toHaveLength(2)
    missingRender.unmount()
  }
})
