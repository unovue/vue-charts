import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, ReferenceLine, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('<ReferenceLine />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: '201102', uv: -6.11, pv: 0 },
    { name: '201103', uv: 0.39, pv: 0 },
    { name: '201104', uv: -1.37, pv: 0 },
    { name: '201105', uv: 1.16, pv: 0 },
    { name: '201106', uv: 1.29, pv: 0 },
    { name: '201107', uv: 0.09, pv: 0 },
    { name: '201108', uv: 0.53, pv: 0 },
    { name: '201109', uv: 2.52, pv: 0 },
    { name: '201110', uv: 0.79, pv: 0 },
    { name: '201111', uv: 2.94, pv: 0 },
    { name: '201112', uv: 4.3, pv: 0 },
  ]

  it('renders 1 line in each ReferenceLine (x and y)', () => {
    const { container } = render(() => (
      <BarChart
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis dataKey="name" orientation="top" />
        <YAxis tickCount={7} orientation="right" />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine x="201106" stroke="#666" label="201106" />
        <ReferenceLine y={0} stroke="#666" label="0" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(2)
  })

  it('renders 1 line in ReferenceLine in vertical barchart', () => {
    const { container } = render(() => (
      <BarChart
        layout="vertical"
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis type="number" orientation="top" />
        <YAxis type="category" dataKey="name" tickCount={7} orientation="right" />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine y="201106" stroke="#666" label="201106" />
        <ReferenceLine x={0} stroke="#666" label="0" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(2)
  })

  it('don\'t render line when no x or y is set', () => {
    const { container } = render(() => (
      <BarChart
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis dataKey="name" orientation="top" />
        <YAxis tickCount={7} orientation="right" />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine stroke="#666" label="0" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(0)
  })

  it('don\'t render line when reference line is outside domain', () => {
    const { container } = render(() => (
      <BarChart
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis dataKey="name" orientation="bottom" />
        <YAxis tickCount={7} orientation="right" />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine y={200} stroke="#666" />
        <ReferenceLine x="20150201" stroke="#666" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(0)
  })

  it('render line and label when ifOverflow is "extendDomain"', () => {
    const { container } = render(() => (
      <BarChart
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis dataKey="name" />
        <YAxis tickCount={7} />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine x="201102" label="test" stroke="#666" />
        <ReferenceLine y={20} stroke="#666" label="20" ifOverflow="extendDomain" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(2)
  })

  it('render line when ifOverflow is "visible" even if outside domain', () => {
    const { container } = render(() => (
      <BarChart
        width={1100}
        height={250}
        barGap={2}
        barSize={6}
        data={data}
        margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
      >
        <XAxis dataKey="name" />
        <YAxis tickCount={7} />
        <Bar dataKey="uv" isAnimationActive={false} />
        <ReferenceLine y={20} stroke="#666" ifOverflow="visible" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-line-line')).toHaveLength(1)
  })

  describe('label', () => {
    it('should render label defined as a string', () => {
      const { container, getByText } = render(() => (
        <BarChart
          width={1100}
          height={250}
          barGap={2}
          barSize={6}
          data={data}
          margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
        >
          <XAxis dataKey="name" orientation="top" />
          <YAxis tickCount={7} orientation="right" />
          <Bar dataKey="uv" isAnimationActive={false} />
          <ReferenceLine x="201106" stroke="#666" label="My label" />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
      expect(getByText('My label')).toBeTruthy()
    })

    it('should render label defined as a number', () => {
      const { container, getByText } = render(() => (
        <BarChart
          width={1100}
          height={250}
          barGap={2}
          barSize={6}
          data={data}
          margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
        >
          <XAxis dataKey="name" orientation="top" />
          <YAxis tickCount={7} orientation="right" />
          <Bar dataKey="uv" isAnimationActive={false} />
          <ReferenceLine x="201106" stroke="#666" label={2024} />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
      expect(getByText('2024')).toBeTruthy()
    })

    it('should render label defined as a Label props object', () => {
      const { container, getByText } = render(() => (
        <BarChart
          width={1100}
          height={250}
          barGap={2}
          barSize={6}
          data={data}
          margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
        >
          <XAxis dataKey="name" orientation="top" />
          <YAxis tickCount={7} orientation="right" />
          <Bar dataKey="uv" isAnimationActive={false} />
          <ReferenceLine
            x="201106"
            stroke="#666"
            label={{ value: 'Object label text', offset: 8 }}
          />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
      expect(getByText('Object label text')).toBeTruthy()
    })
  })

  describe('stroke props', () => {
    it('applies custom stroke color', () => {
      const { container } = render(() => (
        <BarChart
          width={1100}
          height={250}
          data={data}
          margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false} />
          <ReferenceLine y={0} stroke="#ff0000" />
        </BarChart>
      ))
      const line = container.querySelector('.v-charts-reference-line-line')
      expect(line).toBeTruthy()
      expect(line!.getAttribute('stroke')).toBe('#ff0000')
    })
  })

  describe('class', () => {
    it('applies custom class to the reference line layer', () => {
      const { container } = render(() => (
        <BarChart
          width={1100}
          height={250}
          data={data}
          margin={{ top: 20, right: 60, bottom: 0, left: 20 }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false} />
          <ReferenceLine y={0} class="custom-line" />
        </BarChart>
      ))
      expect(container.querySelectorAll('.custom-line')).toHaveLength(1)
    })
  })
})
