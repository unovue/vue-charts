import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideChartContext, useAppSelector, useChartBrush, useChartCartesianAxis, useChartDataActions, useChartGraphicalItems, useChartLayoutActions, useChartLegend, useChartOptions, useChartPolarOptions, useChartReferenceElements, useChartRootProps, useChartTooltip } from '../chartContext'
import type { RechartsRootState } from '../chartState'

describe('chart context SSR', () => {
  it('keeps state current during rendering', async () => {
    const Reader = defineComponent({
      setup() {
        const width = useAppSelector(state => state.layout.width)
        const data = useAppSelector(state => state.chartData.chartData)
        useChartLayoutActions().setProps('horizontal', { width: 321, height: 200 }, {})
        useChartDataActions().setData([1, 2])
        useChartOptions().createEventEmitter()
        expect(useAppSelector(state => state.options.eventEmitter).value).toBeTypeOf('symbol')
        return () => <span>{`${width.value}:${data.value?.length}`}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext()
        return () => <Reader />
      },
    })
    const html = await renderToString(createSSRApp(Fixture))
    expect(html).toBe('<span>321:2</span>')
  })

  it('isolates concurrent requests even when child setup yields', async () => {
    const snapshots: RechartsRootState[] = []
    const renderRequest = (width: number) => {
      const Reader = defineComponent({
        async setup() {
          const selected = useAppSelector(state => state.layout.width)
          const layout = useChartLayoutActions()
          const brush = useChartBrush()
          const legend = useChartLegend()
          const options = useChartOptions()
          const rootProps = useChartRootProps()
          const polarOptions = useChartPolarOptions()
          const references = useChartReferenceElements()
          const state = useAppSelector(state => state)
          expect(state.value.brush.height).toBe(0)
          expect(state.value.legend.payload).toEqual([])
          expect(state.value.rootProps.syncId).toBeUndefined()
          expect(state.value.polarOptions).toBeNull()
          expect(state.value.referenceElements.dots).toEqual([])
          expect(useChartCartesianAxis().state.value).toEqual({ xAxis: {}, yAxis: {}, zAxis: {} })
          expect(useChartGraphicalItems().state.value).toEqual({ countOfBars: 0, cartesianItems: [], polarItems: [] })
          const tooltip = useChartTooltip()
          const index = useAppSelector(state => state.tooltip.keyboardInteraction.index)
          expect(index.value).toBeNull()
          await Promise.resolve()
          layout.setProps('horizontal', { width, height: 200 }, {})
          brush.setBrushSettings({ ...brush.state.value, height: width })
          legend.addLegendPayload([{ value: String(width), color: 'red' }])
          options.createEventEmitter()
          rootProps.updateOptions({ ...rootProps.state.value, syncId: width })
          polarOptions.updatePolarOptions({ cx: width, cy: width, startAngle: width, endAngle: 360, innerRadius: 0, outerRadius: 100 })
          references.addDot({ xAxisId: 0, yAxisId: 0, ifOverflow: 'discard', x: width, y: width, r: 3 })
          tooltip.setKeyboardInteraction({ active: true, activeIndex: String(width), activeDataKey: undefined })
          await Promise.resolve()
          expect(index.value).toBe(String(width))
          expect(state.value.brush.height).toBe(width)
          expect(state.value.legend.payload[0][0].value).toBe(String(width))
          expect(state.value.rootProps.syncId).toBe(width)
          expect(state.value.polarOptions?.startAngle).toBe(width)
          expect(state.value.referenceElements.dots[0].x).toBe(width)
          snapshots.push(state.value)
          return () => <span>{selected.value}</span>
        },
      })
      const Fixture = defineComponent({
        setup() {
          provideChartContext()
          return () => <Reader />
        },
      })
      return renderToString(createSSRApp(Fixture))
    }
    expect(await Promise.all([renderRequest(100), renderRequest(300)]))
      .toEqual(['<span>100</span>', '<span>300</span>'])
    for (const domain of ['brush', 'legend', 'options', 'rootProps', 'polarOptions', 'polarAxis', 'referenceElements', 'cartesianAxis', 'graphicalItems'] as const)
      expect(snapshots[0][domain]).not.toBe(snapshots[1][domain])
    expect(snapshots[0].options.eventEmitter).not.toBe(snapshots[1].options.eventEmitter)
    expect(snapshots[0].polarAxis.angleAxis).not.toBe(snapshots[1].polarAxis.angleAxis)
    expect(snapshots[0].polarAxis.radiusAxis).not.toBe(snapshots[1].polarAxis.radiusAxis)
  })
})
