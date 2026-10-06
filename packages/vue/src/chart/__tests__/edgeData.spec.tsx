import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Funnel,
  FunnelChart,
  Heatmap,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from '@/index'

type Row = { name: string, value: number | null }

const families = [
  {
    name: 'Bar',
    chart: (data: Row[]) => <BarChart width={200} height={100} data={data}><Bar dataKey="value" isAnimationActive={false} /></BarChart>,
    selector: '.v-charts-bar-rectangle',
    counts: [1, 0],
  },
  {
    name: 'Line',
    chart: (data: Row[]) => <LineChart width={200} height={100} data={data}><Line dataKey="value" isAnimationActive={false} /></LineChart>,
    selector: '.v-charts-line-dot',
    counts: [1, 0],
  },
  {
    name: 'Area',
    chart: (data: Row[]) => <AreaChart width={200} height={100} data={data}><Area dataKey="value" dot isAnimationActive={false} /></AreaChart>,
    selector: '.v-charts-area-dot',
    counts: [1, 0],
  },
  {
    name: 'Pie',
    chart: (data: Row[]) => <PieChart width={200} height={100}><Pie data={data} dataKey="value" isAnimationActive={false} /></PieChart>,
    selector: '.v-charts-sector',
    counts: [1, 0],
  },
  {
    name: 'Radar',
    chart: (data: Row[]) => (
      <RadarChart width={200} height={100} data={data}>
        <PolarAngleAxis dataKey="name" />
        <Radar dataKey="value" dot isAnimationActive={false} />
      </RadarChart>
    ),
    selector: '.v-charts-radar-polygon',
    counts: [1, 0],
  },
  {
    name: 'Funnel',
    chart: (data: Row[]) => <FunnelChart width={200} height={100}><Funnel data={data} dataKey="value" isAnimationActive={false} /></FunnelChart>,
    selector: '.v-charts-trapezoid',
    counts: [1, 1],
  },
  {
    name: 'Heatmap',
    chart: (data: Row[]) => <Heatmap width={200} height={100} data={data} xKey="name" yKey={() => 'row'} dataKey="value" isAnimationActive={false} />,
    selector: '.v-charts-cell',
    counts: [1, 1],
  },
]

// A single valid point must survive; missing values must follow each family's policy.
it.each(families)('$name preserves single-point and all-null data', async ({ chart, selector, counts }) => {
  for (const [index, value] of [5, null].entries()) {
    const { container, unmount } = render(() => chart([{ name: 'A', value }]))
    await nextTick()
    await nextTick()
    expect(container.querySelectorAll(selector)).toHaveLength(counts[index])
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
    unmount()
  }
})

it.each([
  { name: 'Bar', chart: () => <Bar dataKey="value" isAnimationActive={false} />, selector: '.v-charts-bar-rectangle' },
  { name: 'Line', chart: () => <Line dataKey="value" isAnimationActive={false} />, selector: '.v-charts-line-dot' },
  { name: 'Area', chart: () => <Area dataKey="value" dot isAnimationActive={false} />, selector: '.v-charts-area-dot' },
])('$name handles large values and duplicate categories', async ({ chart, selector, name }) => {
  const data = [{ name: 'A', value: 1e9 }, { name: 'A', value: 5e8 }, { name: 'B', value: 0 }]
  const Root = name === 'Bar' ? BarChart : name === 'Line' ? LineChart : AreaChart
  const { container } = render(() => (
    <Root width={300} height={200} data={data}>
      <XAxis dataKey="name" allowDuplicatedCategory={false} />
      <YAxis domain={[0, 1e9]} ticks={[0, 5e8, 1e9]} />
      {chart()}
    </Root>
  ))
  await nextTick()
  await nextTick()
  expect(Array.from(container.querySelectorAll('.v-charts-x-axis text'), item => item.textContent)).toEqual(['A', 'B'])
  expect(Array.from(container.querySelectorAll('.v-charts-y-axis text'), item => item.textContent)).toEqual(['0', '500000000', '1000000000'])
  expect(container.querySelectorAll(selector)).toHaveLength(3)
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
})

it('separates positive and negative stacked Bar geometry', () => {
  const { container } = render(() => (
    <BarChart width={200} height={100} stackOffset="sign" data={[{ a: 5, b: -5 }]}>
      <YAxis domain={[-10, 10]} hide />
      <Bar dataKey="a" stackId="stack" isAnimationActive={false} />
      <Bar dataKey="b" stackId="stack" isAnimationActive={false} />
    </BarChart>
  ))
  expect(Array.from(container.querySelectorAll('.v-charts-bar-rectangle path'), item => item.getAttribute('d')))
    .toEqual(['M 24,27.5 h 152 v 22.5 h -152 Z', 'M 24,72.5 h 152 v -22.5 h -152 Z'])
})
