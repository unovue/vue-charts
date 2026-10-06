import type { SlotsType } from 'vue'
import { defineComponent, h } from 'vue'
import type { LabelSlots } from './types'
import { LabelVueProps } from './types'
import { LabelView } from './LabelView'

const _Label = defineComponent({
  name: 'Label',
  props: LabelVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<LabelSlots>,
  setup(props, { attrs, slots }) {
    return () => {
      const { parentViewBox: _parentViewBox, 'parent-view-box': _parentBox, index: _index, ...svgAttrs } = attrs
      return h(LabelView, { ...svgAttrs, ...props }, slots)
    }
  },
})

// Preserve template slot inference in published declarations.
export const Label: typeof _Label & { new (): { $slots: LabelSlots } } = _Label
