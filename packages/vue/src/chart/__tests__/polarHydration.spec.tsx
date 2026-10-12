import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart } from '@/index'

afterEach(() => vi.restoreAllMocks())

const data = [{ name: 'A', value: 72 }, { name: 'B', value: 40 }, { name: 'C', value: 55 }]
function charts() {
  return (
    <div>
      <RadialBarChart width={300} height={220} data={data} startAngle={210} endAngle={-30} innerRadius={40} outerRadius={100}>
        <PolarAngleAxis type="number" domain={[0, 100]} />
        <RadialBar dataKey="value" background cornerRadius={12} isAnimationActive={false} />
      </RadialBarChart>
      <RadarChart width={300} height={220} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <Radar dataKey="value" isAnimationActive={false} />
      </RadarChart>
      <PieChart width={300} height={220}>
        <Pie data={data} dataKey="value" startAngle={210} endAngle={-30} innerRadius={40} paddingAngle={3} label isAnimationActive={false} />
      </PieChart>
    </div>
  )
}

// Node and the browser may return cos/sin values that differ in the last bit. The SVG attributes
// must still match, or Nuxt dev reports hydration attribute mismatches.
it('renders the same polar coordinates when cos and sin differ by one ulp', async () => {
  const exact = await renderToString(createSSRApp(charts))
  const { cos, sin } = Math
  const ulp = (value: number) => value * (1 + Number.EPSILON)
  vi.spyOn(Math, 'cos').mockImplementation(value => ulp(cos(value)))
  vi.spyOn(Math, 'sin').mockImplementation(value => ulp(sin(value)))
  expect(await renderToString(createSSRApp(charts))).toBe(exact)
})
