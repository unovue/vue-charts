import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { defineComponent } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { Label } from '@/components/label/Label'
import type { LabelListVueProps } from '@/components/label/types'
import { parseViewBox } from '@/components/label/utils'
import { useLabelLayerRef } from '@/model/runtime'
import { useCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { Layer } from '@/container/Layer'
import { isNullish } from '@/utils'
import { getValueByDataKey } from '@/utils/chart'

export const LabelListView = defineComponent({
  name: 'LabelListView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof LabelListVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const teleport = useLayerTeleport()
    const labelLayerRef = useLabelLayerRef(null)
    const contextData = useCartesianLabelListData(null)

    return () => {
      // Read per render: series pass a new item object whenever their labels change.
      const props = view.item
      const attrs = view.svgAttrs
      const { dataKey, valueAccessor, clockWise, id, ...others } = props
      const data = props.data ?? contextData?.value
      if (!data || !data.length)
        return null

      const content = (
        <Layer class="v-charts-label-list">
          {data.map((entry, index) => {
            const raw: unknown = isNullish(dataKey)
              ? valueAccessor(entry, index)
              : getValueByDataKey(entry && entry.payload, dataKey!)
            // Without a formatter only text and numbers make a label; other values in messy data
            // show none. A formatter may turn any value into text.
            const value = typeof raw === 'number' || typeof raw === 'string' || ('formatter' in others && others.formatter) ? raw as string | number : undefined
            const idProps = isNullish(id) ? undefined : `${id}-${index}`
            const viewBox = parseViewBox(isNullish(clockWise) ? entry : { ...entry, clockWise })

            // A series fades the labels of shapes that enter or leave.
            const entryOpacity = typeof entry.opacity === 'number' ? { opacity: entry.opacity } : undefined
            const contentSlot = slots.content ?? slots.label
            if (contentSlot) {
              return contentSlot({ ...others, ...attrs, ...entryOpacity, ...viewBox, value, index, key: `label-${String(entry.key ?? index)}` })
            }

            const entryFill = entry.fill != null && !('fill' in others) && !('fill' in attrs) ? entry.fill : undefined

            return (
              <Label
                {...others}
                {...attrs}
                {...(entryFill != null ? { fill: entryFill } : {})}
                {...entryOpacity}
                id={idProps!}
                parentViewBox={entry.parentViewBox}
                value={value}
                viewBox={viewBox}
                key={`label-${String(entry.key ?? index)}`}
                index={index}
              />
            )
          })}
        </Layer>
      )

      return teleport(content, labelLayerRef)
    }
  },
})
