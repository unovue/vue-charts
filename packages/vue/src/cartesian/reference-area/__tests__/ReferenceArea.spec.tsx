import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, ReferenceArea, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('<ReferenceArea />', () => {
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

  it('render 2 rects in ReferenceArea with x1/x2 and y1/y2', () => {
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
        <ReferenceArea x1="201106" x2="201110" fill="#666" label="201106" />
        <ReferenceArea y1={0} y2={2} fill="#666" label="201106" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-area-rect')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(2)
  })

  it('don\'t render any rect in ReferenceArea when no x1, x2, y1 or y2 is set', () => {
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
        <ReferenceArea stroke="#666" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-area-rect')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(0)
  })

  it('render a rect in ReferenceArea when only x1 is set', () => {
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
        <ReferenceArea x1="201106" stroke="#666" label="0" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-area-rect')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
  })

  it('don\'t render rect when x reference area has unknown category values', () => {
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
        <ReferenceArea x1="20150201" x2="20150201" fill="#666" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-area-rect')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(0)
  })

  it('render rect when ifOverflow is "extendDomain"', () => {
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
        <ReferenceArea y1={200} y2={300} fill="#666" ifOverflow="extendDomain" />
      </BarChart>
    ))
    expect(container.querySelectorAll('.v-charts-reference-area-rect')).toHaveLength(1)
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
          <ReferenceArea x1="201106" x2="201110" fill="#666" label="My label text" />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
      expect(getByText('My label text')).toBeTruthy()
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
          <ReferenceArea x1="201106" x2="201110" fill="#666" label={2024} />
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
          <ReferenceArea
            x1="201106"
            x2="201110"
            fill="#666"
            label={{ value: 'Object label text', offset: 8 }}
          />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(1)
      expect(getByText('Object label text')).toBeTruthy()
    })

    it('should not render label when label=false', () => {
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
          <ReferenceArea x1="201106" x2="201110" fill="#666" label={false as any} />
        </BarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(0)
    })
  })

  describe('fill and stroke props', () => {
    it('applies custom fill', () => {
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
          <ReferenceArea x1="201106" x2="201110" fill="#ff0000" />
        </BarChart>
      ))
      const rect = container.querySelector('.v-charts-reference-area-rect')
      expect(rect).toBeTruthy()
      expect(rect!.getAttribute('fill')).toBe('#ff0000')
    })

    it('applies custom stroke', () => {
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
          <ReferenceArea x1="201106" x2="201110" stroke="#00ff00" />
        </BarChart>
      ))
      const rect = container.querySelector('.v-charts-reference-area-rect')
      expect(rect).toBeTruthy()
      expect(rect!.getAttribute('stroke')).toBe('#00ff00')
    })
  })

  describe('class', () => {
    it('applies custom class to the reference area layer', () => {
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
          <ReferenceArea x1="201106" x2="201110" class="custom-area" />
        </BarChart>
      ))
      expect(container.querySelectorAll('.custom-area')).toHaveLength(1)
    })
  })
})
