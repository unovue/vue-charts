import { useChartId } from '@/hooks/useChartId'
import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import type { LabelSlots } from './types'
import { LabelVueProps } from './types'
import { useViewBox } from '@/context/chartLayoutContext'
import { usePolarLabelViewBox } from '@/context/polarLabelViewBoxContext'
import { isNullish } from '@/utils'
import { getAttrsOfCartesianLabel, getAttrsOfPolarLabel, isPolar, renderRadialLabel } from '@/components/label/utils'
import Text from '@/components/Text.vue'

export const Label = defineComponent({
  name: 'Label',
  props: LabelVueProps,
  slots: Object as SlotsType<LabelSlots>,
  setup(props, { slots, attrs }) {
    const radialLabelId = useChartId('v-charts-radial-line')
    const viewBoxFromContext = useViewBox()
    const polarLabelViewBox = usePolarLabelViewBox()

    return () => {
      const { viewBox: viewBoxFromProps, value, position, textBreakAll, formatter } = props
      const viewBox = viewBoxFromProps || polarLabelViewBox.value || viewBoxFromContext.value
      if (
        !viewBox
        || (isNullish(value) && !slots.content)
      ) {
        return null
      }
      const isPolarLabel = isPolar(viewBox)

      // If content slot is provided, pass viewBox to it for custom rendering
      if (slots.content) {
        return slots.content({ ...props, viewBox })
      }

      // Compute label value with optional formatter
      let label = value
      if (typeof formatter === 'function') {
        label = formatter(label)
      }

      // Render radial label for polar positions insideStart/insideEnd/end
      if (isPolarLabel && (position === 'insideStart' || position === 'insideEnd' || position === 'end')) {
        return renderRadialLabel(props, position, label, attrs, viewBox, radialLabelId)
      }

      const positionAttrs = isPolarLabel ? getAttrsOfPolarLabel(props, viewBox) : getAttrsOfCartesianLabel(props, viewBox)

      // Allow textAnchor from attrs to override computed value
      const textAnchor = (attrs.textAnchor != null && (attrs.textAnchor === 'start' || attrs.textAnchor === 'middle' || attrs.textAnchor === 'end'))
        ? attrs.textAnchor
        : positionAttrs.textAnchor

      return (
        <Text
          class={['v-charts-label', props.class]}
          {...attrs}
          {...positionAttrs}
          textAnchor={textAnchor}
          angle={props.angle}
          breakAll={textBreakAll}
          value={label}
        />
      )
    }
  },
})
