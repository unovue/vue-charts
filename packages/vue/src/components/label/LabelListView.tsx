import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { FadeIn } from '@/animation/FadeIn'
import { Label } from '@/components/label/Label'
import type { LabelListVueProps } from '@/components/label/types'
import { parseViewBox } from '@/components/label/utils'
import { useLabelLayerRef } from '@/context/labelLayerContext'
import { useCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { Layer } from '@/container/Layer'
import { isNullish } from '@/utils'
import { getValueByDataKey } from '@/utils/chart'

export const LabelListView = defineComponent({
  name: 'LabelListView',
  inheritAttrs: true,
  props: {
    fade: Boolean,
    item: { type: Object as PropType<ExtractPropTypes<typeof LabelListVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const teleport = useLayerTeleport()
    const labelLayerRef = useLabelLayerRef(null)
    const contextData = useCartesianLabelListData(null)

    return () => {
      const { dataKey, valueAccessor, clockWise, id, ...others } = props
      const data = props.data ?? contextData?.value
      if (!data || !data.length)
        return null

      const content = (
        <Layer class="v-charts-label-list">
          {data.map((entry, index) => {
            const value = isNullish(dataKey)
              ? valueAccessor(entry, index)
              : (getValueByDataKey(entry && entry.payload, dataKey!) as string | number)
            const idProps = isNullish(id) ? undefined : `${id}-${index}`
            const viewBox = parseViewBox(isNullish(clockWise) ? entry : { ...entry, clockWise })

            const contentSlot = slots.content ?? slots.label
            if (contentSlot) {
              return contentSlot({ ...others, ...attrs, ...viewBox, value, index, key: `label-${index}` })
            }

            const entryFill = entry.fill != null && !('fill' in others) && !('fill' in attrs) ? entry.fill : undefined

            return (
              <Label
                {...others}
                {...attrs}
                {...(entryFill != null ? { fill: entryFill } : {})}
                id={idProps!}
                parentViewBox={entry.parentViewBox}
                value={value}
                viewBox={viewBox}
                key={`label-${index}`}
                index={index}
              />
            )
          })}
        </Layer>
      )

      return teleport(view.fade ? h(FadeIn, null, () => content) : content, labelLayerRef)
    }
  },
})
