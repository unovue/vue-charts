import type { PropType, VNode } from 'vue'
import { cloneVNode, defineComponent } from 'vue'
import type { Padding } from '@/types/common'

export const Panorama = defineComponent({
  name: 'Panorama',
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    data: { type: Array as PropType<any[]>, required: true },
    padding: { type: Object as PropType<Padding>, default: () => ({ top: 1, right: 1, bottom: 1, left: 1 }) },
  },
  setup(props, { slots }) {
    return () => {
      const children = slots.default?.() as VNode[] | undefined
      if (!children || children.length !== 1) {
        return null
      }

      const chartElement = children[0]
      const cloned = cloneVNode(chartElement, {
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        margin: props.padding,
        compact: true,
        data: props.data,
      })

      return cloned
    }
  },
})
