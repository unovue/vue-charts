import { Fragment, Teleport, computed, defineComponent, proxyRefs, toRefs } from 'vue'
import type { SVGAttributes, SlotsType } from 'vue'
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

export const Line = defineComponent({
  name: 'Line',
  props: LineVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<ActivePointsSlots & { default?: () => any, shape?: (props: any) => any, dot?: (props: any) => any, label?: (props: any) => any }>,
  setup(props: LineProps, { attrs, slots }: { attrs: SVGAttributes, slots: any }) {
    const data = useSetupGraphicalItem(props, 'line')
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, needClip, clipPathId, lineData, points } = useLine(trackedProps, attrs, slots.shape, slots.dot, slots.label)
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
          <ActivePoints
            points={lineData.value ?? []}
            mainColor={attrs.stroke ?? props.stroke!}
            itemDataKey={props.dataKey}
            activeDot={props.activeDot}
          >
            {activeDot}
          </ActivePoints>
        </Fragment>
      )

      // Teleport into graphical layer so lines render above cursor
      if (graphicalLayerRef?.value) {
        return <Teleport to={graphicalLayerRef.value}>{lineContent}</Teleport>
      }
      return lineContent
    }
  },
})
