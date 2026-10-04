import { defineComponent, h } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { LabelListVueProps } from './types'
import { LabelListView } from './LabelListView'

/** Internal opt-in used by series after their geometry settles. */
export const AnimatedLabelList = defineComponent({
  props: LabelListVueProps,
  setup(props, { attrs, slots }) {
    const View = useDeferredView(LabelListView)
    return () => h(View, { item: props, svgAttrs: attrs, fade: true }, slots)
  },
})
