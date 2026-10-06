import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Pie, PieChart } from '@/index'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { Legend } from '@/components/legend'
import { Cell } from '@/components/Cell'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('pieChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Group A', value: 400, v: 89 },
    { name: 'Group B', value: 300, v: 100 },
    { name: 'Group C', value: 200, v: 200 },
    { name: 'Group D', value: 200, v: 20 },
    { name: 'Group E', value: 278, v: 40 },
    { name: 'Group F', value: 189, v: 60 },
  ]

  describe('basic rendering', () => {
    it('renders 6 sectors in simple PieChart', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })

    it('renders 1 sector when data has one element', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={[data[0]]}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(1)
    })

    it('renders 4 sectors for 4 equal data points', () => {
      const crossData = [
        { name: 'Group A', value: 100 },
        { name: 'Group B', value: 100 },
        { name: 'Group C', value: 100 },
        { name: 'Group D', value: 100 },
      ]

      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={crossData}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(4)
    })

    it('renders nothing when data is empty', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={[]}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(0)
    })

    it('renders nothing when all values are zero', () => {
      const emptyData = [
        { name: 'Group A', value: 0 },
        { name: 'Group B', value: 0 },
        { name: 'Group C', value: 0 },
      ]

      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={emptyData}
            cx={200}
            cy={200}
            outerRadius={80}
          />
        </PieChart>
      ))

      // When all values are 0, sectors have startAngle === endAngle so Sector returns null
      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(0)
    })
  })

  describe('donut chart (innerRadius)', () => {
    it('renders sectors with innerRadius', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            innerRadius={40}
            outerRadius={80}
            fill="#ff7300"
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
      // All sector paths should have arcs (donut shape)
      sectors.forEach((sector) => {
        const d = sector.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d).toContain('A')
      })
    })
  })

  describe('custom startAngle and endAngle', () => {
    it('renders a semicircle pie', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
            startAngle={0}
            endAngle={180}
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })

    it('renders with negative startAngle', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
            startAngle={-90}
            endAngle={270}
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })
  })

  describe('paddingAngle', () => {
    it('renders sectors with padding between them', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
            paddingAngle={5}
          />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })
  })

  describe('with Cell children', () => {
    it('renders sectors with Cell-specified fills', () => {
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })
  })

  describe('tooltip integration', () => {
    it('renders sectors alongside Tooltip without errors', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
          <Tooltip />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })
  })

  describe('with Legend', () => {
    it('renders pie sectors alongside Legend without errors', () => {
      const { container } = render(() => (
        <PieChart width={800} height={400}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx={200}
            cy={200}
            outerRadius={80}
            fill="#ff7300"
          />
          <Legend />
        </PieChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(6)
    })
  })
})
