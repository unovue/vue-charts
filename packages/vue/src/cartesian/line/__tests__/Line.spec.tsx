import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { CartesianGrid, LabelList, Line, LineChart, Tooltip, XAxis, YAxis } from '@/index'
import { assertNotNull } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('line', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  function getLineCurves(container: Element): NodeListOf<Element> {
    return container.querySelectorAll('.v-charts-line .v-charts-line-curve')
  }

  describe('basic rendering', () => {
    it('renders 1 line curve in simple LineChart', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      expect(curves[0].getAttribute('stroke')).toBe('#ff7300')
      expect(curves[0].getAttribute('fill')).toBe('none')
    })

    it('renders 2 line curves for 2 Line children', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
          <Line type="monotone" dataKey="pv" stroke="#387908" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(2)
      expect(curves[0].getAttribute('stroke')).toBe('#ff7300')
      expect(curves[1].getAttribute('stroke')).toBe('#387908')
    })

    it('renders with specified stroke color', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line dataKey="uv" stroke="#ff0000" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      expect(curves[0].getAttribute('stroke')).toBe('#ff0000')
    })

    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={[]}>
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(0)
    })

    it('renders no line curve when dataKey does not match the source data', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line type="monotone" dataKey="nonexistent" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(0)
    })

    it('renders 1 dot and no line when data has only 1 element', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data.slice(0, 1)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Line isAnimationActive={false} label type="monotone" dataKey="uv" stroke="#ff7300" />
        </LineChart>
      ))

      expect(container.querySelectorAll('.v-charts-line-curve')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-line-dot')).toHaveLength(1)
    })
  })

  describe('curve type', () => {
    it('renders smooth curve when type is monotone', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis />
          <YAxis type="category" />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // monotone curves contain 'C' (cubic bezier) commands
      expect(d).toContain('C')
    })

    it('renders step curve when type is step', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis />
          <YAxis type="category" />
          <Line type="step" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // step curves contain only M and L commands (no C)
      expect(d).not.toContain('C')
      expect(d).toContain('L')
    })

    it('renders linear curve when type is linear', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis />
          <YAxis type="category" />
          <Line type="linear" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // linear has M and L only, no curves
      expect(d).not.toContain('C')
      expect(d).toContain('L')
      expect(d).toContain('M')
    })
  })

  describe('connectNulls', () => {
    const breakData = [
      { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
      { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
      { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
      { name: 'Page D', uv: null, pv: 9800, amt: 2400 },
      { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
      { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
    ]

    it('renders two path segments when connectNulls is false', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={breakData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis />
          <YAxis type="category" />
          <Line type="monotone" connectNulls={false} dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // Two M commands means two separate path segments (gap at null)
      const mCount = d.split('M').length - 1
      expect(mCount).toBe(2)
    })

    it('renders one continuous path when connectNulls is true', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={breakData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis />
          <YAxis type="category" />
          <Line type="monotone" connectNulls dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // One M command means a single continuous path
      const mCount = d.split('M').length - 1
      expect(mCount).toBe(1)
    })
  })

  describe('strokeDasharray', () => {
    it('renders line with strokeDasharray', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line type="monotone" dataKey="uv" stroke="#ff7300" strokeDasharray="5 5" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      const dasharray = curves[0].getAttribute('stroke-dasharray') ?? curves[0].getAttribute('strokeDasharray')
      assertNotNull(dasharray)
      expect(dasharray).toContain('5')
    })
  })

  describe('dots and labels', () => {
    it('renders dots when dot is true', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line isAnimationActive={false} type="monotone" dot dataKey="uv" stroke="#ff7300" />
        </LineChart>
      ))

      expect(container.querySelectorAll('.v-charts-line-dots')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-line-dot')).toHaveLength(6)
    })

    it('renders labels when label is true', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line isAnimationActive={false} type="monotone" label dataKey="uv" stroke="#ff7300" />
        </LineChart>
      ))

      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(6)
    })

    it('renders customized dot via dot slot', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" dot>
            {{
              dot: ({ cx, cy }: { cx?: number, cy?: number }) => (
                <circle cx={cx} cy={cy} r={5} class="customized-dot" />
              ),
            }}
          </Line>
        </LineChart>
      ))

      expect(container.querySelectorAll('.customized-dot')).toHaveLength(6)
    })

    it('renders customized active dot via slot', async () => {
      const { container } = render(() => (
        <div style="width: 400px; height: 400px;">
          <LineChart width={400} height={400} data={data}>
            <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false}>
              {{
                activeDot: ({ cx, cy }: { cx?: number, cy?: number }) => (
                  <circle cx={cx} cy={cy} r={10} class="customized-active-dot" />
                ),
              }}
            </Line>
            <Tooltip />
          </LineChart>
        </div>
      ))

      const chart = container.querySelector('.v-charts-wrapper')
      assertNotNull(chart)
      expect(container.querySelectorAll('.customized-active-dot')).toHaveLength(0)

      await fireEvent(chart as Element, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      }))

      expect(container.querySelectorAll('.customized-active-dot')).toHaveLength(1)
    })
  })

  describe('hide prop', () => {
    it('hides line when hide is true', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <Line type="monotone" dataKey="uv" stroke="#ff7300" hide isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(0)
    })
  })

  describe('vertical layout', () => {
    it('renders line in vertical layout', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
    })
  })

  describe('with other components', () => {
    it('renders with CartesianGrid', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      expect(container.querySelector('.v-charts-cartesian-grid')).toBeTruthy()
    })

    it('renders with XAxis and YAxis', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(1)
      expect(container.querySelector('.v-charts-x-axis')).toBeTruthy()
      expect(container.querySelector('.v-charts-y-axis')).toBeTruthy()
    })

    it('renders with Tooltip', async () => {
      const { container } = render(() => (
        <div style="width: 400px; height: 400px;">
          <LineChart width={400} height={400} data={data}>
            <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
            <Tooltip />
          </LineChart>
        </div>
      ))

      const chart = container.querySelector('.v-charts-wrapper')
      assertNotNull(chart)

      await fireEvent(chart as Element, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      }))

      const tooltip = container.querySelector('.v-charts-tooltip-content')
      expect(tooltip).toBeTruthy()
    })
  })

  describe('multiple Line series', () => {
    it('renders multiple lines with different yAxisIds', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Line yAxisId="left" dataKey="pv" stroke="#8884d8" isAnimationActive={false} />
          <Line yAxisId="right" dataKey="uv" stroke="#82ca9d" isAnimationActive={false} />
        </LineChart>
      ))

      const curves = getLineCurves(container)
      expect(curves).toHaveLength(2)
      expect(curves[0].getAttribute('stroke')).toBe('#8884d8')
      expect(curves[1].getAttribute('stroke')).toBe('#82ca9d')
    })
  })

  it('withholds LabelList children until the line has settled, like its own labels', () => {
    const { container } = render(() => (
      <LineChart width={400} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
        <Line dataKey="value"><LabelList /></Line>
      </LineChart>
    ))
    // JSDOM never advances motion, so the entrance is still running.
    expect(container.querySelectorAll('.v-charts-label-list text')).toHaveLength(0)
  })
})
