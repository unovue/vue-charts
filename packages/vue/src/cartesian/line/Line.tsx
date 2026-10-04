import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { useSeriesPointEvents } from '@/events/usePointEvents'
import { lineEvents } from '@/events/itemEvents'
import type { PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { LineProps } from './type'
import { LineVueProps } from './type'
import { useLine } from '@/cartesian/line/hooks/useLine'
import { Layer } from '@/container/Layer'
import { StaticLine } from '@/cartesian/line/StaticLine'
import { ActivePoints } from '@/cartesian/line/ActivePoints'
import type { ActivePointsSlots } from './ActivePoints'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { GraphicalItemClipPath } from '@/cartesian/GraphicalItemClipPath'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'

export type LineSlots = ActivePointsSlots & {
  default?: () => import('vue').VNodeChild
  shape?: (props: import('@/shape/Curve').CurveProps) => import('vue').VNodeChild
  dot?: (props: { cx: number, cy: number, index: number, value?: number, payload?: unknown }) => import('vue').VNodeChild
  label?: (props: import('@/components/label/types').LabelListSlotProps) => import('vue').VNodeChild
}

const LineView = defineComponent({
  name: 'LineView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<LineProps>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<LineSlots>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, needClip, clipPathId, lineData, points, isAnimating } = useLine(trackedProps, attrs, slots.shape, slots.dot, slots.label)
    const activeListeners = useSeriesPointEvents(lineEvents.use(), () => props.dataKey, () => lineData.value ?? [])
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)

    // LabelList children show once the line has settled, like the series' own labels.
    provideCartesianLabelListData(computed(() => isAnimating.value ? undefined : lineData.value as any))

    return () => {
      if (!shouldRender.value) {
        return null
      }

      const defaultContent = props.hide ? undefined : slots.default?.()

      const lineContent = (
        <Fragment>
          <Layer class={['v-charts-line', attrs.class]}>
            {needClip.value && (
              <defs>
                <GraphicalItemClipPath clipPathId={clipPathId.value} xAxisId={props.xAxisId} yAxisId={props.yAxisId} />
              </defs>
            )}
            <StaticLine />
            {defaultContent}
          </Layer>
          <Layer {...activeListeners}>
            {!props.hide && <ActivePoints
              points={lineData.value ?? []}
              mainColor={attrs.stroke ?? props.stroke!}
              itemDataKey={props.dataKey}
              activeDot={props.activeDot}
              isAnimationActive={props.isAnimationActive}
              v-slots={{ activeDot: slots.activeDot }}
            />}
          </Layer>
        </Fragment>
      )

      // Teleport into graphical layer so lines render above cursor
      return teleport(lineContent, graphicalLayerRef)
    }
  },
})

const _Line = defineComponent({
  name: 'Line',
  emits: lineEvents.emits,
  props: LineVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<LineSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    lineEvents.provide(emit)
    const data = useSetupGraphicalItem(props, 'line')
    const View = useDeferredView(LineView)
    return () => h(View, { item: props, svgAttrs: attrs, data }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Line: typeof _Line & { new (): { $slots: LineSlots } } = _Line
