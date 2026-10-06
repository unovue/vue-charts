import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Pie, PieChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 500 }))

it.each([
  { name: 'empty data', data: [], cx: '50%', cy: '50%', paths: [], fills: [] },
  {
    name: 'four equal sectors',
    data: [1, 1, 1, 1].map(value => ({ value })),
    cx: '50%',
    cy: '50%',
    paths: [
      'M 350,250 A 100,100,0,0,0,250,150 L 250,250 Z',
      'M 250,150 A 100,100,0,0,0,150,250 L 250,250 Z',
      'M 150,250 A 100,100,0,0,0,249.99999999999997,350 L 250,250 Z',
      'M 249.99999999999997,350 A 100,100,0,0,0,350,250.00000000000003 L 250,250 Z',
    ],
    fills: ['gray', 'gray', 'gray', 'gray'],
  },
  {
    name: 'row fill',
    data: [{ value: 1, fill: '#ff0000' }, { value: 1 }],
    cx: '50%',
    cy: '50%',
    paths: ['M 350,250 A 100,100,0,0,0,150,250 L 250,250 Z', 'M 150,250 A 100,100,0,0,0,350,250.00000000000003 L 250,250 Z'],
    fills: ['#ff0000', 'gray'],
  },
  {
    name: 'percentage center',
    data: [{ value: 1 }, { value: 1 }],
    cx: '25%',
    cy: '75%',
    paths: ['M 227.5,372.5 A 100,100,0,0,0,27.5,372.5 L 127.5,372.5 Z', 'M 27.5,372.5 A 100,100,0,0,0,227.5,372.5 L 127.5,372.5 Z'],
    fills: ['gray', 'gray'],
  },
])('renders $name through PieChart', async ({ data, cx, cy, paths, fills }) => {
  const { container } = render(() => (
    <PieChart width={500} height={500}>
      <Pie data={data} dataKey="value" cx={cx} cy={cy} outerRadius={100} fill="gray" isAnimationActive={false} />
    </PieChart>
  ))
  await nextTick()
  await nextTick()
  const sectors = [...container.querySelectorAll('.v-charts-pie .v-charts-sector')]
  expect(sectors.map(sector => sector.getAttribute('d'))).toEqual(paths)
  expect(sectors.map(sector => sector.getAttribute('fill'))).toEqual(fills)
})
