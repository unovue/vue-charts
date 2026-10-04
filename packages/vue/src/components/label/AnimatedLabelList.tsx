import { defineComponent, h } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { LabelListVueProps } from './types'
import { LabelListView } from './LabelListView'

/** Internal opt-in used by series after their geometry settles. */
export const AnimatedLabelList = defineComponent({
  props: { ...LabelListVueProps, animate: { type: Boolean, default: true } },
  setup(props, { attrs, slots }) {
    const View = useDeferredView(LabelListView)
    return () => {
      const { animate, ...item } = props
      return h(View, { item, svgAttrs: attrs, fade: animate }, slots)
    }
  },
})
