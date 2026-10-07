import type { PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useSeriesProps } from '@/hooks/useSeriesProps'
import { useSeriesPointEvents } from '@/events/usePointEvents'
import { lineEvents } from '@/events/itemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { LineInput, LineSlots } from './type'
import { LineVueProps } from './type'
import { useLine } from '@/cartesian/line/hooks/useLine'
import { Layer } from '@/container/Layer'
import { StaticLine } from '@/cartesian/line/StaticLine'
import { ActivePoints } from '@/cartesian/ActivePoints'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { DotsClipPath, GraphicalItemClipPath } from '@/cartesian/GraphicalItemClipPath'
import { useGraphicalLayerRef } from '@/model/runtime'
import { mainColor } from '@/core/color'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { forwardsSvgAttributes } from '@/utils/attributes'

export type { LineSlots } from './type'

const LineView = defineComponent({
  name: 'LineView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<LineInput>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<LineSlots>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, needClip, clipPathId, lineData, points, labelData } = useLine(trackedProps, attrs, slots.shape, slots.dot, slots.label)
    const activeListeners = useSeriesPointEvents(lineEvents.use(), () => props.dataKey, () => lineData.value ?? [])
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)

    // LabelList children ride along with the line, like the series' own labels.
    provideCartesianLabelListData(labelData)

    return () => {
      if (!shouldRender.value) {
        return null
      }

      const defaultContent = props.hide ? undefined : slots.default?.()

      const lineContent = (
        <Fragment>
          <Layer data-slot="series" class={['v-charts-line', props.class]}>
            {needClip.value && (
              <defs>
                <GraphicalItemClipPath clipPathId={clipPathId.value} xAxisId={props.xAxisId} yAxisId={props.yAxisId} />
                <DotsClipPath clipPathId={clipPathId.value} dot={props.dot} />
              </defs>
            )}
            <StaticLine />
            {defaultContent}
          </Layer>
          <Layer {...activeListeners}>
            {!props.hide && (
              <ActivePoints
                points={lineData.value ?? []}
                mainColor={mainColor('line', props)}
                itemDataKey={props.dataKey}
                activeDot={props.activeDot}
                isAnimationActive={props.isAnimationActive}
                v-slots={{ activeDot: slots.activeDot }}
              />
            )}
          </Layer>
        </Fragment>
      )

      // Teleport into graphical layer so lines render above cursor
      return teleport(lineContent, graphicalLayerRef)
    }
  },
})

export const Line = forwardsSvgAttributes(defineComponent({
  name: 'Line',
  emits: lineEvents.emits,
  props: LineVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<LineSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps, ['stroke'])
    lineEvents.provide(emit)
    const { data } = useSetupGraphicalItem(props, 'line')
    const View = useDeferredView(LineView)
    return () => h(View, { item: props, svgAttrs: attrs, data }, slots)
  },
}))
