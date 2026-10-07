import type { SlotsType } from 'vue'
import type { LabelListSlots } from './types'
import { defineComponent, h } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { LabelListVueProps } from './types'
import { LabelListView } from './LabelListView'

export const LabelList = defineComponent({
  name: 'LabelList',
  props: LabelListVueProps,
  slots: Object as SlotsType<LabelListSlots>,
  setup(props, { attrs, slots }) {
    const View = useDeferredView(LabelListView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
