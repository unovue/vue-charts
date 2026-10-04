import { Teleport, computed, defineComponent, proxyRefs, toRefs } from 'vue'
import type { SVGAttributes, SlotsType } from 'vue'
import type { BarProps, BarPropsWithSVG } from './type'
import { BarVueProps } from './type'
import { useBar } from '@/cartesian/bar/hooks/useBar'
import { Layer } from '@/container/Layer'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { GraphicalItemClipPath } from '@/cartesian/GraphicalItemClipPath'
import { BarBackground } from '@/cartesian/bar/components/BarBackground'
import { BarRectangles } from '@/cartesian/bar/components/BarRectangles'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useChartLayout } from '@/context/chartLayoutContext'
import { createErrorBarRegistry, provideErrorBarContext, provideErrorBarRegistry } from '@/cartesian/error-bar/ErrorBarContext'
import { LabelList } from '@/components/label'
import type { ErrorBarDataItem, ErrorBarDataPointFormatter } from '@/cartesian/error-bar/ErrorBarContext'
import type { BarRectangleItem } from '@/types/bar'
import { getValueByDataKey } from '@/utils/chart'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { extractCellProps, filterOutCells } from '@/utils/cell'

const errorBarDataPointFormatter: ErrorBarDataPointFormatter<BarRectangleItem> = (
  dataPoint,
  dataKey,
): ErrorBarDataItem => {
  const value = Array.isArray(dataPoint.value) ? dataPoint.value[1] : dataPoint.value
  return {
    x: dataPoint.x,
    y: dataPoint.y,
    value: value as number,
    errorVal: getValueByDataKey(dataPoint.payload ?? dataPoint, dataKey),
  }
}

export const Bar = defineComponent<BarPropsWithSVG>({
  name: 'Bar',
  props: BarVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{
    default?: () => any
    activeDot?: (props: any) => any
    shape?: (props: any) => any
    activeBar?: (props: any) => any
  }>,
  setup(props: BarProps, { attrs, slots }: { attrs: SVGAttributes, slots: any }) {
    const errorBarRegistry = createErrorBarRegistry()
    provideErrorBarRegistry(errorBarRegistry)
    const data = useSetupGraphicalItem(props, 'bar', { errorBars: errorBarRegistry.errorBars })
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, clipPathId, barData, isAnimating, cellProps: cellPropsRef } = useBar(trackedProps, slots.shape, slots.activeBar)
    const { needClip } = useNeedsClip(props.xAxisId, props.yAxisId)
    const layout = useChartLayout()

    const errorBarOffset = computed(() => {
      const first = barData.value?.[0]
      if (first == null || first.height == null || first.width == null)
        return 0
      return layout.value === 'vertical' ? first.height / 2 : first.width / 2
    })

    provideErrorBarContext({
      data: barData,
      xAxisId: props.xAxisId ?? 'xAxis-0',
      yAxisId: props.yAxisId ?? 'yAxis-0',
      dataPointFormatter: errorBarDataPointFormatter,
      errorBarOffset,
    })

    const labelListData = computed(() => {
      if (isAnimating.value || !barData.value)
        return undefined
      return barData.value.map((entry, i) => {
        const fill = cellPropsRef.value?.[i]?.fill ?? entry.payload?.fill ?? props.fill
        return {
          x: entry.x,
          y: entry.y,
          width: entry.width,
          height: entry.height,
          value: entry.value,
          payload: entry.payload,
          parentViewBox: entry.parentViewBox,
          ...(fill != null ? { fill } : {}),
        }
      })
    })
    provideCartesianLabelListData(labelListData)

    const graphicalLayerRef = useGraphicalLayerRef(null)

    return () => {
      if (!shouldRender.value) {
        return null
      }

      // Extract Cell props from default slot before rendering
      const defaultContent = slots.default?.() ?? []
      const cells = extractCellProps(defaultContent)
      cellPropsRef.value = cells
      const nonCellContent = cells.length > 0 ? filterOutCells(defaultContent) : defaultContent

      const barContent = (
        <Layer class={['v-charts-bar', attrs.class]}>
          {
            needClip.value && (
              <defs>
                <GraphicalItemClipPath clipPathId={clipPathId} xAxisId={props.xAxisId} yAxisId={props.yAxisId} />
              </defs>
            )
          }
          <Layer class="v-charts-bar-rectangles" clip-path={needClip.value ? `url(#clipPath-${clipPathId})` : null}>
            {props.background && <BarBackground />}
            <BarRectangles />
          </Layer>
          {!isAnimating.value && props.label && (
            <LabelList
              {...(typeof props.label === 'object' ? props.label : {})}
              data={barData.value}
            />
          )}
          {nonCellContent}
        </Layer>
      )

      // Teleport bars into graphical layer so they render above cursor but below labels
      if (graphicalLayerRef?.value) {
        return <Teleport to={graphicalLayerRef.value}>{barContent}</Teleport>
      }
      return barContent
    }
  },
})
