import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { Area, Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { assertNotNull } from '@/test/helper'
import { useChartHeight, useChartWidth, useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/chart/provideClipPathId'

describe('<ComposedChart />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 })
  })

  const data = [
    { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
    { name: 'Page B', uv: 868, pv: 967, amt: 1506 },
    { name: 'Page C', uv: 1397, pv: 1098, amt: 989 },
    { name: 'Page D', uv: 1480, pv: 1200, amt: 1228 },
    { name: 'Page E', uv: 1520, pv: 1108, amt: 1100 },
    { name: 'Page F', uv: 1400, pv: 680, amt: 1700 },
  ]

  it('render 1 line, 1 area, 1 bar in the ComposedChart', () => {
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid stroke="#f5f5f5" />
        <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" isAnimationActive={false} />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" isAnimationActive={false} />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </ComposedChart>
    ))

    expect(container.querySelectorAll('.v-charts-line .v-charts-line-curve')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-bar')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-area .v-charts-area-area')).toHaveLength(1)
  })

  it('render 1 bar, 1 dot when data has only one element', () => {
    const singleData = [data[0]]
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={singleData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis dataKey="pv" orientation="left" yAxisId="left" />
        <YAxis dataKey="uv" orientation="right" yAxisId="right" />
        <CartesianGrid stroke="#f5f5f5" />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" yAxisId="left" isAnimationActive={false} />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" yAxisId="right" isAnimationActive={false} />
      </ComposedChart>
    ))
    expect(container.querySelectorAll('.v-charts-line-dot')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-bar .v-charts-bar-rectangle')).toHaveLength(1)
  })

  it('renders mixed chart with multiple Bar and Line components', () => {
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="pv" fill="#413ea0" isAnimationActive={false} />
        <Bar dataKey="amt" fill="#82ca9d" isAnimationActive={false} />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </ComposedChart>
    ))

    expect(container.querySelectorAll('.v-charts-bar')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-line .v-charts-line-curve')).toHaveLength(1)
  })

  it('renders empty chart when data is empty', () => {
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={[]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="pv" fill="#413ea0" isAnimationActive={false} />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </ComposedChart>
    ))

    expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-line .v-charts-line-curve')).toHaveLength(0)
  })

  it('renders CartesianGrid in ComposedChart', () => {
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid stroke="#f5f5f5" />
        <Bar dataKey="pv" fill="#413ea0" isAnimationActive={false} />
      </ComposedChart>
    ))

    expect(container.querySelectorAll('.v-charts-cartesian-grid')).toHaveLength(1)
  })

  it('mouseEnter ComposedChart should show tooltip and cursor', async () => {
    const { container } = render(() => (
      <ComposedChart width={800} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#f5f5f5" />
        <Area isAnimationActive={false} type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
        <Bar isAnimationActive={false} dataKey="pv" barSize={20} fill="#413ea0" />
        <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
      </ComposedChart>
    ))

    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent.mouseEnter(chart, { clientX: 200, clientY: 100 })
    await nextTick()

    // Tooltip cursor should be visible after mouse enter
    expect(container.querySelectorAll('.v-charts-tooltip-cursor')).toHaveLength(1)
  })

  describe('composedChart layout context', () => {
    it('should provide viewBox', () => {
      let viewBoxValue: any
      const Comp = defineComponent({
        setup() {
          const vb = useViewBox()
          viewBoxValue = vb
          return () => null
        },
      })

      render(() => (
        <ComposedChart width={100} height={50} barSize={20}>
          <Comp />
        </ComposedChart>
      ))

      expect(viewBoxValue.value).toEqual({ height: 40, width: 90, x: 5, y: 5 })
    })

    it('should provide clipPathId', () => {
      let clipPathIdValue: any
      const Comp = defineComponent({
        setup() {
          clipPathIdValue = useClipPathId()
          return () => null
        },
      })

      render(() => (
        <ComposedChart width={100} height={50} barSize={20}>
          <Comp />
        </ComposedChart>
      ))

      expect(clipPathIdValue).toMatch(/^v-charts[\w-]+-clip$/)
    })

    it('should provide width', () => {
      let widthValue: any
      const Comp = defineComponent({
        setup() {
          widthValue = useChartWidth()
          return () => null
        },
      })

      render(() => (
        <ComposedChart width={100} height={50} barSize={20}>
          <Comp />
        </ComposedChart>
      ))

      expect(widthValue.value).toBe(100)
    })

    it('should provide height', () => {
      let heightValue: any
      const Comp = defineComponent({
        setup() {
          heightValue = useChartHeight()
          return () => null
        },
      })

      render(() => (
        <ComposedChart width={100} height={50} barSize={20}>
          <Comp />
        </ComposedChart>
      ))

      expect(heightValue.value).toBe(50)
    })
  })
})
