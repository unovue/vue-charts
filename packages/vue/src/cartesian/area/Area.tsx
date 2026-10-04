import { useSeriesPointEvents } from '@/events/usePointEvents'
import { areaEvents } from '@/events/itemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, defineComponent, h, proxyRefs, toRefs } from 'vue'
import type { PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { AreaDotSlotProps, AreaProps } from './type'
import { AreaVueProps } from './type'
import { useArea } from '@/cartesian/area/hooks/useArea'
import { Layer } from '@/container/Layer'
import { StaticArea } from '@/cartesian/area/RenderArea'
import { ActivePoints } from '@/cartesian/area/ActivePoints'
import type { ActivePointsSlots } from './ActivePoints'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'

export type AreaSlots = ActivePointsSlots & {
  dot?: (props: AreaDotSlotProps) => any
}

// Geometry and rendering, deferred so every sibling has registered first (see useDeferredView).
const AreaView = defineComponent({
  name: 'AreaView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<AreaProps>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
  },
  slots: Object as SlotsType<AreaSlots>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const trackedProps = proxyRefs({ ...toRefs(props), data: view.data })
    const { shouldRender, areaData } = useArea(trackedProps, attrs, slots.dot)
    const activeListeners = useSeriesPointEvents(areaEvents.use(), () => props.dataKey, () => areaData.value?.points ?? [])
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)

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

      const areaContent = (
        <Fragment>
          <Layer class={['v-charts-area', attrs.class]}>
            <StaticArea />
          </Layer>
          <Layer {...activeListeners}>
            <ActivePoints
              points={areaData.value?.points ?? []}
              mainColor={getLegendItemColor(attrs.stroke, props.fill!)}
              itemDataKey={props.dataKey}
              activeDot={props.activeDot}
            >
              {activeDot}
            </ActivePoints>
          </Layer>
        </Fragment>
      )

      // Teleport into graphical layer so areas render above cursor
      return teleport(areaContent, graphicalLayerRef)
    }
  },
})

const _Area = defineComponent({
  name: 'Area',
  emits: areaEvents.emits,
  props: AreaVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<AreaSlots>,
  setup(props, { attrs, slots, emit }) {
    areaEvents.provide(emit)
    const data = useSetupGraphicalItem(props, 'area')
    const View = useDeferredView(AreaView)
    return () => h(View, { item: props, data, svgAttrs: attrs }, slots)
  },
})

/**
 * Type-safe Area component with slot types preserved in .d.ts output.
 * The `new () => { $slots }` pattern ensures Volar picks up slot types
 * even when consuming from compiled declarations.
 */
export const Area = _Area as typeof _Area & {
  new (): { $slots: AreaSlots }
}

function getLegendItemColor(stroke: string | undefined, fill: string): string {
  return stroke && stroke !== 'none' ? stroke : fill
}
