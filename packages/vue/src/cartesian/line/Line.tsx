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

const LineView = defineComponent({
  name: 'LineView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<LineProps>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<ActivePointsSlots & { default?: () => any, shape?: (props: any) => any, dot?: (props: any) => any, label?: (props: any) => any }>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, needClip, clipPathId, lineData, points } = useLine(trackedProps, attrs, slots.shape, slots.dot, slots.label)
    const activeListeners = useSeriesPointEvents(lineEvents.use(), () => props.dataKey, () => lineData.value ?? [])
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)

    // Provide label list data so LabelList children can consume it via context
    provideCartesianLabelListData(computed(() => lineData.value as any))

    return () => {
      if (!shouldRender.value) {
        return null
      }

      let activeDot
      if (slots.activeDot) {
        activeDot = {
          activeDot: slots.activeDot,
        }
      }

      const defaultContent = slots.default?.()

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
            <ActivePoints
              points={lineData.value ?? []}
              mainColor={attrs.stroke ?? props.stroke!}
              itemDataKey={props.dataKey}
              activeDot={props.activeDot}
            >
              {activeDot}
            </ActivePoints>
          </Layer>
        </Fragment>
      )

      // Teleport into graphical layer so lines render above cursor
      return teleport(lineContent, graphicalLayerRef)
    }
  },
})

export const Line = defineComponent({
  name: 'Line',
  emits: lineEvents.emits,
  props: LineVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<ActivePointsSlots & { default?: () => any, shape?: (props: any) => any, dot?: (props: any) => any, label?: (props: any) => any }>,
  setup(props, { attrs, slots, emit }) {
    lineEvents.provide(emit)
    const data = useSetupGraphicalItem(props, 'line')
    const View = useDeferredView(LineView)
    return () => h(View, { item: props, svgAttrs: attrs, data }, slots)
  },
})
