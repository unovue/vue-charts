import type { SlotsType } from 'vue'
import { defineComponent, h } from 'vue'
import type { LabelSlots } from './types'
import { LabelVueProps } from './types'
import { LabelView } from './LabelView'

export const Label = defineComponent({
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
