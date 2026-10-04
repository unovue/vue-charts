import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { barEvents } from '@/events/itemEvents'
import type { PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { BarProps } from './type'
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

export interface BarSlots {
  label?: (props: import('@/components/label/types').LabelListSlotProps) => import('vue').VNodeChild
  default?: () => import('vue').VNode[]
  shape?: (props: BarRectangleItem & { index: number, isActive: boolean }) => import('vue').VNodeChild
  activeBar?: (props: BarRectangleItem & { index: number, isActive: boolean }) => import('vue').VNodeChild
}

const BarView = defineComponent({
  name: 'BarView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<BarProps>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<BarSlots>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, clipPathId, barData, isAnimating, cellProps: cellPropsRef } = useBar(trackedProps, attrs, slots.shape, slots.activeBar)
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

    const renderGeometry = () => {
      if (!shouldRender.value) {
        return null
      }

      return (
        <Fragment>
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
        </Fragment>
      )
    }

    // Default children (notably ErrorBar) must register before any deferred geometry runs.
    // Keep their context in this synchronous shell; defer only the geometry render.
    const Geometry = useDeferredView(defineComponent({
      name: 'BarGeometry',
      setup: () => renderGeometry,
    }))
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)
    return () => {
      if (!shouldRender.value)
        return null
      const children = slots.default?.() ?? []
      const cells = extractCellProps(children)
      cellPropsRef.value = cells
      return teleport((
        <Layer class={['v-charts-bar', attrs.class]}>
          {h(Geometry)}
          {cells.length > 0 ? filterOutCells(children) : children}
        </Layer>
      ), graphicalLayerRef,
      )
    }
  },
})

const _Bar = defineComponent({
  name: 'Bar',
  emits: barEvents.emits,
  props: BarVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<BarSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    barEvents.provide(emit)
    const errorBarRegistry = createErrorBarRegistry()
    provideErrorBarRegistry(errorBarRegistry)
    const data = useSetupGraphicalItem(props, 'bar', { errorBars: errorBarRegistry.errorBars })
    return () => h(BarView, { item: props, svgAttrs: attrs, data }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Bar: typeof _Bar & { new (): { $slots: BarSlots } } = _Bar
