import type { PropType, SVGAttributes, ShallowRef, SlotsType, VNodeChild } from 'vue'
import type { LabelListSlotProps } from '@/components/label/types'
import { useSeriesProps } from '@/hooks/useSeriesProps'
import { useSeriesPointEvents } from '@/events/usePointEvents'
import { areaEvents } from '@/events/itemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { AreaDotSlotProps, ResolvedAreaProps } from './type'
import { AreaVueProps } from './type'
import { useArea } from '@/cartesian/area/hooks/useArea'
import { Layer } from '@/container/Layer'
import { StaticArea } from '@/cartesian/area/RenderArea'
import { ActivePoints } from '@/cartesian/ActivePoints'
import type { ActivePointsSlots } from '@/cartesian/ActivePoints'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { useGraphicalLayerRef } from '@/model/runtime'
import { mainColor } from '@/core/color'
import { DotsClipPath, GraphicalItemClipPath } from '@/cartesian/GraphicalItemClipPath'
import { forwardsSvgAttributes } from '@/utils/attributes'

export type AreaSlots = ActivePointsSlots & {
  label?: (props: LabelListSlotProps) => VNodeChild
  dot?: (props: AreaDotSlotProps) => VNodeChild
}

// Geometry and rendering, deferred so every sibling has registered first (see useDeferredView).
const AreaView = defineComponent({
  name: 'AreaView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ResolvedAreaProps>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
  },
  slots: Object as SlotsType<AreaSlots>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const trackedProps = proxyRefs({ ...toRefs(props), data: view.data })
    const { shouldRender, areaData, needClip, clipPathId } = useArea(trackedProps, attrs, slots.dot)
    const activeListeners = useSeriesPointEvents(areaEvents.use(), () => areaData.value?.points ?? [])
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)

    return () => {
      if (!shouldRender.value) {
        return null
      }

      const areaContent = (
        <Fragment>
          <Layer data-slot="series" class={['v-charts-area', props.class]}>
            {needClip.value && (
              <defs>
                <GraphicalItemClipPath clipPathId={clipPathId.value} xAxisId={props.xAxisId} yAxisId={props.yAxisId} />
                <DotsClipPath clipPathId={clipPathId.value} dot={props.dot} />
              </defs>
            )}
            <StaticArea v-slots={{ label: slots.label }} />
          </Layer>
          <Layer {...activeListeners}>
            {!props.hide && (
              <ActivePoints
                points={areaData.value?.points ?? []}
                mainColor={mainColor('area', props)}
                itemDataKey={props.dataKey}
                activeDot={props.activeDot}
                isAnimationActive={props.isAnimationActive}
                v-slots={{ activeDot: slots.activeDot }}
              />
            )}
          </Layer>
        </Fragment>
      )

      // Teleport into graphical layer so areas render above cursor
      return teleport(areaContent, graphicalLayerRef)
    }
  },
})

export const Area = forwardsSvgAttributes(defineComponent({
  name: 'Area',
  emits: areaEvents.emits,
  props: AreaVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<AreaSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps, ['fill', 'stroke'])
    areaEvents.provide(emit)
    const { data } = useSetupGraphicalItem(props, 'area')
    const View = useDeferredView(AreaView)
    return () => h(View, { item: props, data, svgAttrs: attrs }, slots)
  },
}))
