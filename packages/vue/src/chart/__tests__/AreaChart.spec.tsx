import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Area, AreaChart, Tooltip, XAxis, YAxis } from '@/index'
import { assertNotNull, expectAreaCurve } from '@/test/helper'
import type { ActivePointSlotProps } from '@/cartesian/area/ActivePoints'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { useAppSelector } from '@/state/hooks'
import type { AreaSettings } from '@/state/selectors/areaSelectors'
import { selectArea } from '@/state/selectors/areaSelectors'
import { selectTicksOfAxis } from '@/state/selectors/axisSelectors'
import { defineComponent } from 'vue'
import { useChartHeight, useChartWidth, useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/chart/provideClipPathId'

describe('areaChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  it('renders 2 path in simple AreaChart', async () => {
    const { container } = render({
      components: { AreaChart, Area },
      template: `
        <AreaChart :width="100" :height="50" :data="data">
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      `,
      setup() {
        return { data }
      },
    })
    expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(1)

    expectAreaCurve(container, [
      {
        d: 'M5,5C11,10,17,15,23,15C29,15,35,15,41,15C47,15,53,25,59,25C65,25,71,17.2,77,17.2C83,17.2,89,21.65,95,26.1',
      },
    ])
  })

  it('renders 1 dot when data only have one element', async () => {
    const { container } = render({
      components: { AreaChart, Area },
      template: `
        <AreaChart :width="100" :height="50" :data="data">
          <Area type="monotone" dataKey="pv" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      `,
      setup() {
        return { data: data.slice(0, 1) }
      },
    })
    expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(1)
    expectAreaCurve(container, [])
  })

  it('renders no path when dataKey does not match the source data', async () => {
    const { container } = render({
      components: { AreaChart, Area },
      template: `
        <AreaChart :width="100" :height="50" :data="data">
          <Area type="monotone" dataKey="any" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      `,
      setup() {
        return { data }
      },
    })
    const areaPath = container.querySelectorAll('.v-charts-area-area')
    const curvePath = container.querySelectorAll('.v-charts-area-curve')

    expect(areaPath).toHaveLength(0)
    expect(curvePath).toHaveLength(0)
  })

  it('renders customized active dot when activeDot is set to be a Vue component', async () => {
    const { container } = render(() => (
      <div role="main" style="width: 400px; height: 400px;">
        <AreaChart width={400} height={400} data={data}>
          <Area
            type="monotone"
            dataKey="uv"
            stroke="#ff7300"
            fill="#ff7300"
          >
            {{
              activeDot: ({ cx, cy }: ActivePointSlotProps) => <circle cx={cx} cy={cy} r={10} class="customized-active-dot" fill="#ff7300" />,
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

    const dot = container.querySelectorAll('.customized-active-dot')
    expect(dot).toHaveLength(1)
  })

  it('renders customized active dot when activeDot is set to be a function', async () => {
    const { container } = render(() => (
      <div role="main" style={{ width: '400px', height: '400px' }}>
        <AreaChart width={400} height={400} data={data}>
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300">
            {{
              activeDot: ({ cx, cy }: ActivePointSlotProps) => <circle cx={cx} cy={cy} r={10} class="customized-active-dot" />,
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
    const dot = container.querySelectorAll('.customized-active-dot')
    expect(dot).toHaveLength(1)
  })

  it('renders 4 path in a stacked AreaChart', async () => {
    const { container } = render(() => (
      <AreaChart width={100} height={50} data={data}>
        <Area type="monotone" dataKey="uv" stackId="test" stroke="#ff7300" fill="#ff7300" />
        <Area type="monotone" dataKey="pv" stackId="test" stroke="#ff7300" fill="#ff7300" />
      </AreaChart>
    ))
    expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(2)

    expectAreaCurve(container, [
      {
        d: 'M5,5C11,10,17,15,23,15C29,15,35,15,41,15C47,15,53,25,59,25C65,25,71,17.2,77,17.2C83,17.2,89,21.65,95,26.1',
      },
      {
        d: 'M5,33.8C11,29.666,17,25.532,23,25.532C29,25.532,35,38.208,41,38.208C47,38.208,53,5,59,5C65,5,71,28.256,77,28.256C83,28.256,89,26.65,95,25.044',
      },
    ])
  })

  it('renders a path in a vertical AreaChart', async () => {
    const { container } = render(() => (
      <AreaChart width={100} height={50} data={data} layout="vertical">
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" />
      </AreaChart>
    ))
    expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(1)

    expectAreaCurve(container, [
      {
        d: 'M95,5C91.25,5.667,87.5,6.333,87.5,7C87.5,7.667,87.5,8.333,87.5,9C87.5,9.667,80,10.333,80,11C80,11.667,85.85,12.333,85.85,13C85.85,13.667,82.513,14.333,79.175,15',
      },
    ])
  })

  it('renders a stacked percentage chart', async () => {
    const toPercent = (decimal: number, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`

    const areaSpy = vi.fn()
    const xAxisTicksSpy = vi.fn()
    const Comp = defineComponent({
      setup() {
        const areaSettings: AreaSettings = {
          baseValue: undefined,
          stackId: '1',
          dataKey: 'uv',
          connectNulls: false,
          data: undefined,
        }
        areaSpy(useAppSelector(state => selectArea(state, 0, 0, false, areaSettings)).value)
        xAxisTicksSpy(useAppSelector(state => selectTicksOfAxis(state, 'xAxis', 0, false)).value)
        return () => null
      },
    })

    const { container } = render(() => (
      <AreaChart
        width={500}
        height={400}
        data={data}
        stackOffset="expand"
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
      >
        <XAxis dataKey="name" />
        <YAxis tickFormatter={toPercent} />
        <Area dataKey="uv" stackId="1" />
        <Area dataKey="pv" stackId="1" />
        <Area dataKey="amt" stackId="1" />
        <Comp />
        {/* <Customized component={Comp} /> */}
      </AreaChart>
    ))

    expect(xAxisTicksSpy).toHaveBeenLastCalledWith([
      {
        coordinate: 80,
        index: 0,
        offset: 0,
        value: 'Page A',
      },
      {
        coordinate: 158,
        index: 1,
        offset: 0,
        value: 'Page B',
      },
      {
        coordinate: 236,
        index: 2,
        offset: 0,
        value: 'Page C',
      },
      {
        coordinate: 314,
        index: 3,
        offset: 0,
        value: 'Page D',
      },
      {
        coordinate: 392,
        index: 4,
        offset: 0,
        value: 'Page E',
      },
      {
        coordinate: 470,
        index: 5,
        offset: 0,
        value: 'Page F',
      },
    ])
    expect(xAxisTicksSpy).toHaveBeenCalledTimes(1)

    expectAreaCurve(container, [
      {
        d: 'M80,10L158,95L236,95L314,180L392,113.7L470,189.35',
      },
      {
        d: 'M80,254.8L158,184.522L236,292.268L314,10L392,207.676L470,180.374',
      },
      {
        d: 'M80,223.714L158,173.516L236,250.477L314,48.857L392,190.054L470,170.553',
      },
    ])
  })

  it('renders dots and labels when dot is set to true', async () => {
    const { container } = render(
      <AreaChart width={100} height={50} data={data}>
        <Area isAnimationActive={false} type="monotone" dot label dataKey="uv" stroke="#ff7300" fill="#ff7300" />
      </AreaChart>,
    )
    expect(container.querySelectorAll('.v-charts-area-dots')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(6)
    expect(container.querySelectorAll('.v-charts-label-list')).toHaveLength(1)
    expect(container.querySelectorAll('.v-charts-label')).toHaveLength(6)
  })

  it('render empty when data is empty', async () => {
    const { container } = render(
      <AreaChart width={100} height={50} data={[]}>
        <Area type="monotone" dot label dataKey="uv" stroke="#ff7300" fill="#ff7300" />
      </AreaChart>,
    )
    expect(container.querySelectorAll('.v-charts-area-area')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-area-curve')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-area-dots')).toHaveLength(0)
    expect(container.querySelectorAll('.v-charts-label-list')).toHaveLength(0)
  })

  // describe('<AreaChart /> - Pure Rendering', () => {
  //   const pureElements = [Area]

  //   const spies: MockInstance[] = []
  //   let axisSpy: MockInstance

  //   beforeEach(() => {
  //     pureElements.forEach((el, i) => {
  //       spies[i] = vi.spyOn(el.prototype, 'render')
  //     })
  //     axisSpy = vi.spyOn(CartesianAxis.prototype, 'render')
  //   })

  //   // const chart = {
  //   //   components: { AreaChart, Area, Tooltip, XAxis, YAxis, Brush },
  //   //   template: `
  //   //     <AreaChart :width="400" :height="400" :data="data">
  //   //       <Area :isAnimationActive="false" type="monotone" dot label dataKey="uv" />
  //   //       <Tooltip />
  //   //       <XAxis />
  //   //       <YAxis />
  //   //       <Brush />
  //   //     </AreaChart>
  //   //   `,
  //   //   setup() {
  //   //     return { data }
  //   //   },
  //   // }

  //   // it('should only render Area once when the mouse enters and moves', async () => {
  //   //   const { container } = render(chart)

  //   //   spies.forEach(el => expect(el.mock.calls.length).toBe(1))
  //   //   expect(axisSpy).toHaveBeenCalledTimes(3)

  //   //   await fireEvent.mouseEnter(container, { clientX: 30, clientY: 200 })
  //   //   await fireEvent.mouseMove(container, { clientX: 200, clientY: 200 })
  //   //   await fireEvent.mouseLeave(container)

  //   //   spies.forEach(el => expect(el.mock.calls.length).toBe(1))
  //   //   expect(axisSpy).toHaveBeenCalledTimes(3)
  //   // })

  //   // it('should only render Area once when the brush moves but doesn\'t change start/end indices', async () => {
  //   //   const { container } = render(chart)

  //   //   spies.forEach(el => expect(el).toHaveBeenCalledTimes(1))
  //   //   expect(axisSpy).toHaveBeenCalledTimes(3)

  //   //   const brushSlide = container.querySelector('.v-charts-brush-slide')
  //   //   assertNotNull(brushSlide)
  //   //   await fireEvent.mouseDown(brushSlide)
  //   //   await fireEvent.mouseMove(brushSlide, { clientX: 200, clientY: 200 })
  //   //   await fireEvent.mouseUp(window)

  //   //   spies.forEach(el => expect(el).toHaveBeenCalledTimes(1))
  //   //   expect(axisSpy).toHaveBeenCalledTimes(3)
  //   // })

  //   // it('should only show the last data when the brush travelers all moved to the right', async () => {
  //   //   const { container } = render(chart)

  //   //   const leftBrushTraveler = container.querySelector('.v-charts-brush-traveller')
  //   //   assertNotNull(leftBrushTraveler)
  //   //   assertNotNull(window)
  //   //   await fireEvent.mouseDown(leftBrushTraveler)
  //   //   await fireEvent.mouseMove(window, { clientX: 400, clientY: 0 })
  //   //   await fireEvent.mouseUp(window)

  //   //   expect(leftBrushTraveler?.firstChild).toHaveAttribute('x', '390')
  //   //   expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(1)
  //   // })

  //   // it('should only show the first data when the brush travelers all moved to the left', async () => {
  //   //   const { container } = render(chart)

  //   //   const rightBrushTraveler = container.querySelectorAll('.v-charts-brush-traveller')[1]
  //   //   assertNotNull(rightBrushTraveler)
  //   //   await fireEvent.mouseDown(rightBrushTraveler, { clientX: 400, clientY: 0 })
  //   //   await fireEvent.mouseMove(window, { clientX: 0, clientY: 0 })
  //   //   await fireEvent.mouseUp(window)

  //   //   expect(rightBrushTraveler?.firstChild).toHaveAttribute('x', '65')
  //   //   expect(container.querySelectorAll('.v-charts-area-dot')).toHaveLength(1)
  //   // })
  // })

  describe('areaChart layout context', () => {
    it('should provide viewBox', async () => {
      const spy = vi.fn()
      const Comp = {
        setup() {
          spy(useViewBox().value)
          return () => null
        },
      }
      render({
        components: { AreaChart, Comp },
        template: `
          <AreaChart :width="100" :height="50" :barSize="20">
            <Comp />
          </AreaChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenLastCalledWith({ x: 5, y: 5, width: 90, height: 40 })
    })

    it('should provide clipPathId', async () => {
      const spy = vi.fn()
      const Comp = {
        setup() {
          spy(useClipPathId())
          return () => null
        },
      }
      render({
        components: { AreaChart, Comp },
        template: `
          <AreaChart :width="100" :height="50" :barSize="20">
            <Comp />
          </AreaChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^v-charts[\w-]+-clip$/))
    })

    it('should provide width', async () => {
      const spy = vi.fn()
      const Comp = {
        setup() {
          spy(useChartWidth().value)
          return () => null
        },
      }
      render({
        components: { AreaChart, Comp },
        template: `
          <AreaChart :width="100" :height="50" :barSize="20">
            <Comp />
          </AreaChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(100)
    })

    it('should provide height', async () => {
      const spy = vi.fn()
      const Comp = {
        setup() {
          spy(useChartHeight().value)
          return () => null
        },
      }
      render({
        components: { AreaChart, Comp },
        template: `
          <AreaChart :width="100" :height="50" :barSize="20">
            <Comp />
          </AreaChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(50)
    })
  })

  it('renders null points as 0 if stacked and connectNulls is true', async () => {
    const dataWithNullPV = [
      { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
      { name: 'Page B', uv: 300, amt: 2400 },
      { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    ]
    const { container } = render({
      components: { AreaChart, Area },
      template: `
        <AreaChart :width="100" :height="50" :data="dataWithNullPV">
          <Area stackId="1" connectNulls type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" />
          <Area stackId="1" connectNulls type="monotone" dataKey="pv" stroke="#ff7300" fill="#ff7300" />
          <Area stackId="1" connectNulls type="monotone" dataKey="amt" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      `,
      setup() {
        return { dataWithNullPV }
      },
    })

    expectAreaCurve(container, [
      {
        d: 'M5,5C20,10,35,15,50,15C65,15,80,15,95,15',
      },
      {
        d: 'M5,5C20,22.857,35,40.714,50,40.714C65,40.714,80,30.729,95,20.743',
      },
      {
        d: 'M5,10.333C20,18.667,35,27,50,27C65,27,80,22.34,95,17.68',
      },
    ])
  })
})
