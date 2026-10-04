import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Area, AreaChart, Tooltip, XAxis, YAxis } from '@/index'
import { assertNotNull } from '@/test/helper'
import type { ActivePointSlotProps } from '@/cartesian/area/ActivePoints'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('area', () => {
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

  describe('basic rendering', () => {
    it('renders area curve path (fill + stroke)', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(1)
    })

    it('renders with specified fill color', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={300} data={data}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff0000" isAnimationActive={false} />
        </AreaChart>
      ))

      const areaFill = container.querySelector('.v-charts-area-area')
      assertNotNull(areaFill)
      expect(areaFill.getAttribute('fill')).toBe('#ff0000')
    })

    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={[]}>
          <Area type="monotone" dot label dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-dots')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-label-list')).toHaveLength(0)
    })

    it('renders no path when dataKey does not match the source data', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data}>
          <Area type="monotone" dataKey="nonexistent" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
    })

    it('renders 1 dot when data only has one element', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data.slice(0, 1)}>
          <Area type="monotone" dataKey="pv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(1)
    })
  })

  describe('curve type', () => {
    it('renders smooth curve when type is monotone', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const curves = container.querySelectorAll('.v-charts-area-curve')
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // monotone curves contain 'C' (cubic bezier) commands
      expect(d).toContain('C')
    })

    it('renders step curve when type is step', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Area type="step" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const curves = container.querySelectorAll('.v-charts-area-curve')
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // step curves contain only M, L, H, V commands (no C)
      expect(d).not.toContain('C')
    })

    it('renders linear curve when type is linear', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Area type="linear" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const curves = container.querySelectorAll('.v-charts-area-curve')
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // linear has M and L only, no curves
      expect(d).not.toContain('C')
      expect(d).toContain('L')
      expect(d).toContain('M')
    })
  })

  describe('stacking', () => {
    it('renders 4 paths in a stacked AreaChart (2 areas + 2 curves)', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data}>
          <Area type="monotone" dataKey="uv" stackId="test" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
          <Area type="monotone" dataKey="pv" stackId="test" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(2)
    })
  })

  describe('connectNulls', () => {
    const breakData = [
      { name: 'Page A', uv: 400, pv: 2400 },
      { name: 'Page B', uv: 300, pv: 4567 },
      { name: 'Page C', uv: null, pv: 1398 },
      { name: 'Page D', uv: 200, pv: 9800 },
      { name: 'Page E', uv: 278, pv: 3908 },
    ]

    it('renders separate path segments when connectNulls is false (default)', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={breakData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Area type="monotone" connectNulls={false} dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const curves = container.querySelectorAll('.v-charts-area-curve')
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // Two M commands means two separate path segments (gap at null)
      const mCount = d.split('M').length - 1
      expect(mCount).toBe(2)
    })

    it('renders one continuous path when connectNulls is true', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={breakData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Area type="monotone" connectNulls dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const curves = container.querySelectorAll('.v-charts-area-curve')
      expect(curves).toHaveLength(1)
      const d = curves[0].getAttribute('d')
      assertNotNull(d)
      // One M command means a single continuous path
      const mCount = d.split('M').length - 1
      expect(mCount).toBe(1)
    })
  })

  describe('dots and labels', () => {
    it('renders dots when dot is true', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data}>
          <Area isAnimationActive={false} type="monotone" dot dataKey="uv" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-dots')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(6)
    })

    it('renders labels when label is true', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data}>
          <Area isAnimationActive={false} type="monotone" dot label dataKey="uv" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-label-list')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-label')).toHaveLength(6)
    })

    it('renders customized dot via dot slot', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={300} data={data}>
          <Area isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" dot>
            {{
              dot: ({ cx, cy }: { cx?: number, cy?: number }) => (
                <circle cx={cx} cy={cy} r={5} class="customized-dot" />
              ),
            }}
          </Area>
        </AreaChart>
      ))

      expect(container.querySelectorAll('.customized-dot')).toHaveLength(6)
    })
  })

  describe('hide prop', () => {
    it('hides area when hide is true', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={300} data={data}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" hide isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
    })
  })

  describe('activeDot', () => {
    it('renders customized active dot via slot', async () => {
      const { container } = render(() => (
        <div style="width: 400px; height: 400px;">
          <AreaChart width={400} height={400} data={data}>
            <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false}>
              {{
                activeDot: ({ cx, cy }: ActivePointSlotProps) => (
                  <circle cx={cx} cy={cy} r={10} class="customized-active-dot" fill="#ff7300" />
                ),
              }}
            </Area>
            <Tooltip />
          </AreaChart>
        </div>
      ))

      const chart = container.querySelector('.v-charts-wrapper')
      assertNotNull(chart)

      await fireEvent(chart as Element, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      }))

      expect(container.querySelectorAll('.customized-active-dot')).toHaveLength(1)
    })
  })

  describe('vertical layout', () => {
    it('renders area in vertical layout', () => {
      const { container } = render(() => (
        <AreaChart width={100} height={50} data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(1)
    })
  })

  describe('with other components', () => {
    it('renders with XAxis and YAxis', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(1)
      expect(container.querySelector('.v-charts-x-axis')).toBeTruthy()
      expect(container.querySelector('.v-charts-y-axis')).toBeTruthy()
    })

    it('renders with Tooltip', async () => {
      const { container } = render(() => (
        <div style="width: 400px; height: 400px;">
          <AreaChart width={400} height={400} data={data}>
            <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
            <Tooltip />
          </AreaChart>
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

  describe('multiple Area series', () => {
    it('renders multiple areas with different dataKeys', () => {
      const { container } = render(() => (
        <AreaChart width={400} height={400} data={data}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
          <Area type="monotone" dataKey="pv" stroke="#387908" fill="#387908" isAnimationActive={false} />
        </AreaChart>
      ))

      expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(2)
    })
  })
})
