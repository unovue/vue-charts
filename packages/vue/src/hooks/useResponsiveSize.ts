import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import { useRoundedSize } from '@/hooks/useRoundedSize'
import type { RoundedSize } from '@/hooks/useRoundedSize'
import { useInitialDimension } from '@/container/useSizeContext'
import { validateWidthHeight } from '@/utils'

export const chartSizeProps = {
  width: { type: Number },
  height: { type: Number },
  aspect: { type: Number },
  initialDimension: { type: Object as PropType<RoundedSize> },
}

interface ChartSizeProps {
  width?: number
  height?: number
  aspect?: number
  initialDimension?: RoundedSize
}

/** The server and first client render share the same initial geometry. */
export function useResponsiveSize(props: ChartSizeProps) {
  const inheritedInitial = useInitialDimension(null)
  const { size, setSize } = useRoundedSize()
  const measured = ref(false)
  const isResponsive = computed(() => typeof props.width !== 'number' || typeof props.height !== 'number')
  const initial = computed(() => props.initialDimension ?? inheritedInitial?.value ?? {
    width: 640,
    height: props.aspect && props.aspect > 0 ? 640 / props.aspect : 360,
  })
  const effectiveWidth = computed(() => isResponsive.value ? (measured.value ? size.value.width : initial.value.width) : props.width ?? 0)
  const effectiveHeight = computed(() => isResponsive.value ? (measured.value ? size.value.height : initial.value.height) : props.height ?? 0)
  const hasValidSize = computed(() => validateWidthHeight({ width: effectiveWidth.value, height: effectiveHeight.value }))
  function handleResize(width: number, height: number) {
    // A hidden or not-yet-laid-out box must not erase the server geometry.
    if (!isResponsive.value || !validateWidthHeight({ width, height }))
      return
    setSize(width, height)
    measured.value = true
  }
  return { effectiveWidth, effectiveHeight, hasValidSize, handleResize, isResponsive, measured }
}
