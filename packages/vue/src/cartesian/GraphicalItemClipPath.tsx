import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useOffset } from '@/context/chartLayoutContext'
import { isClipDot } from '@/core/coordinates'

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
      if (!needClip.value)
        return null
      const clipX = needClipX.value
      const clipY = needClipY.value
      const { left, top, width, height } = offset.value
      // An axis without allowDataOverflow does not clip: the rect reaches half a plot past it.
      return (
        <clipPath id={`clipPath-${props.clipPathId}`}>
          <rect
            x={clipX ? left : left - width / 2}
            y={clipY ? top : top - height / 2}
            width={clipX ? width : width * 2}
            height={clipY ? height : height * 2}
          />
        </clipPath>
      )
    }
  },
})

/**
 * Dots with `clipDot: false` may overflow the plot by their own size; Line and Area clip them
 * with this rect instead of the series clip (Recharts rule: dot size = 2 * r + strokeWidth).
 */
export const DotsClipPath = defineComponent({
  name: 'DotsClipPath',
  props: {
    clipPathId: { type: String, required: true },
    dot: { type: [Boolean, Object, Function] as PropType<boolean | object>, default: undefined },
  },
  setup(props) {
    const offset = useOffset()
    return () => {
      if (isClipDot(props.dot))
        return null
      const dot = typeof props.dot === 'object' && props.dot !== null ? props.dot : {}
      const r = 'r' in dot ? Number(dot.r) : 3
      const strokeWidth = 'strokeWidth' in dot ? Number(dot.strokeWidth) : 2
      const size = r * 2 + strokeWidth
      const { left, top, width, height } = offset.value
      return (
        <clipPath id={`clipPath-dots-${props.clipPathId}`}>
          <rect x={left - size / 2} y={top - size / 2} width={width + size} height={height + size} />
        </clipPath>
      )
    }
  },
})
