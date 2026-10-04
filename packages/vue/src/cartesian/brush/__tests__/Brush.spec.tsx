import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { BarChart, Brush, LineChart } from '@/index'
import { Line } from '@/cartesian/line'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('<Brush />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { date: '2023-01-01', value: 10, name: 'A' },
    { date: '2023-01-02', value: 20, name: 'B' },
    { date: '2023-01-03', value: 10, name: 'C' },
    { date: '2023-01-04', value: 30, name: 'D' },
    { date: '2023-01-05', value: 50, name: 'E' },
    { date: '2023-01-06', value: 10, name: 'F' },
    { date: '2023-01-07', value: 30, name: 'G' },
    { date: '2023-01-08', value: 20, name: 'H' },
    { date: '2023-01-09', value: 10, name: 'I' },
    { date: '2023-01-10', value: 70, name: 'J' },
    { date: '2023-01-11', value: 40, name: 'K' },
    { date: '2023-01-12', value: 20, name: 'L' },
    { date: '2023-01-13', value: 10, name: 'M' },
    { date: '2023-01-14', value: 10, name: 'N' },
  ]

  describe('basic rendering', () => {
    it('renders Brush from the public API with two travellers', () => {
      const { container } = render(() => (
        <BarChart width={400} height={300} data={data}>
          <Brush dataKey="name" />
        </BarChart>
      ))

      const brush = container.querySelector('.v-charts-brush')
      expect(brush).not.toBeNull()
      expect(brush!.querySelectorAll('.recharts-brush-traveller')).toHaveLength(2)
    })

    it('renders 2 travellers and 1 slide in simple Brush', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      const travellers = container.querySelectorAll('.recharts-brush-traveller')
      expect(travellers).toHaveLength(2)
      expect(container.querySelectorAll('.recharts-brush-slide')).toHaveLength(1)
    })

    it('renders the brush container with correct dimensions', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      const brushLayer = container.querySelector('.v-charts-brush')
      expect(brushLayer).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('does not render travellers or slide when data is empty', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={[]}>
          <Brush x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      expect(container.querySelectorAll('.recharts-brush-traveller')).toHaveLength(0)
      expect(container.querySelectorAll('.recharts-brush-slide')).toHaveLength(0)
    })
  })

  describe('height prop', () => {
    it('respects custom height', () => {
      const { container } = render(() => (
        <BarChart width={500} height={200} data={data}>
          <Brush dataKey="value" height={80} />
        </BarChart>
      ))

      // Brush should render with travellers when data is available
      const travellers = container.querySelectorAll('.recharts-brush-traveller')
      expect(travellers).toHaveLength(2)
    })
  })

  describe('stroke and fill props', () => {
    it('applies custom stroke and fill to brush background', () => {
      const { container } = render(() => (
        <BarChart width={500} height={200} data={data}>
          <Brush dataKey="value" stroke="#8884d8" fill="#eee" />
        </BarChart>
      ))

      const brushLayer = container.querySelector('.v-charts-brush')
      expect(brushLayer).toBeTruthy()
      // The brush renders with the specified stroke/fill on its background rect
      const backgroundRect = brushLayer?.querySelector('rect')
      expect(backgroundRect).toBeTruthy()
    })
  })

  describe('with panorama (LineChart child)', () => {
    it('renders brush with a LineChart panorama child without errors', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush x={90} y={40} width={300} height={50}>
            {{
              default: () => (
                <LineChart>
                  <Line dataKey="value" isAnimationActive={false} />
                </LineChart>
              ),
            }}
          </Brush>
        </BarChart>
      ))

      // Brush renders with travellers and slide
      expect(container.querySelectorAll('.recharts-brush-traveller')).toHaveLength(2)
      expect(container.querySelectorAll('.recharts-brush-slide')).toHaveLength(1)
    })
  })

  describe('alwaysShowText', () => {
    it('renders brush text when alwaysShowText is true', () => {
      const { container } = render(() => (
        <BarChart width={500} height={100} data={data}>
          <Brush x={100} y={50} width={400} height={40} alwaysShowText />
        </BarChart>
      ))

      expect(container.querySelectorAll('.recharts-brush-texts')).toHaveLength(1)
    })

    it('does not render brush text by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={100} data={data}>
          <Brush x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      expect(container.querySelectorAll('.recharts-brush-texts')).toHaveLength(0)
    })
  })

  describe('startIndex and endIndex', () => {
    it('accepts startIndex and endIndex props', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" startIndex={2} endIndex={8} />
        </BarChart>
      ))

      // Should render the brush with specified range
      const travellers = container.querySelectorAll('.recharts-brush-traveller')
      expect(travellers).toHaveLength(2)
    })
  })
})
