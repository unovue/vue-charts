import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useOffset } from '@/context/chartLayoutContext'

export const GraphicalItemClipPath = defineComponent({
  name: 'GraphicalItemClipPath',
  props: {
    xAxisId: {
      type: [String, Number] as PropType<string | number>,
      default: 0,
    },
    yAxisId: {
      type: [String, Number] as PropType<string | number>,
      default: 0,
    },
    clipPathId: {
      type: String as PropType<string>,
      required: true,
    },
  },
  setup(props) {
    const offset = useOffset()
    const { needClipX, needClipY, needClip } = useNeedsClip(() => props.xAxisId!, () => props.yAxisId!)

    return () => {
      if (!needClip)
        return null
      const { left, top, width, height } = offset.value
      return (
        <clipPath id={`clipPath-${props.clipPathId}`}>
          <rect
            x={needClipX ? left : left - width / 2}
            y={needClipY ? top : top - height / 2}
            width={needClipX ? width : width * 2}
            height={needClipY ? height : height * 2}
          />
        </clipPath>
      )
    }
  },
})
