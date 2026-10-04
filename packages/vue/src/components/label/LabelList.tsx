import type { LabelListSlots } from './types'
import { defineComponent, h } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { LabelListVueProps } from './types'
import { LabelListView } from './LabelListView'

const _LabelList = defineComponent({
  props: LabelListVueProps,
  setup(props, { attrs, slots }) {
    const View = useDeferredView(LabelListView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const LabelList: typeof _LabelList & { new (): { $slots: LabelListSlots } } = _LabelList
