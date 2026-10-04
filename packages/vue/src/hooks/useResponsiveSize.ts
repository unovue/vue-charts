import { computed, ref } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import { useRoundedSize } from '@/hooks/useRoundedSize'
import type { RoundedSize } from '@/hooks/useRoundedSize'
import { useInitialDimension } from '@/container/useSizeContext'
import { validateWidthHeight } from '@/utils'
import { provideChartSize } from '@/animation/renderPhase'

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

/**
 * Resolves the chart size per dimension: a finite nonnegative `width` or `height` prop is fixed, a missing or invalid
 * one follows the measured box. The server and the first client render share the same initial
 * geometry, so hydration matches; measurement happens after mount.
 */
export function useResponsiveSize(props: ChartSizeProps) {
  const inheritedInitial = useInitialDimension(null)
  const { size, setSize } = useRoundedSize()
  const measured = ref(false)
  const fixedWidth = computed(() => typeof props.width === 'number' && Number.isFinite(props.width) && props.width >= 0 ? props.width : undefined)
  const fixedHeight = computed(() => typeof props.height === 'number' && Number.isFinite(props.height) && props.height >= 0 ? props.height : undefined)
  const isResponsive = computed(() => fixedWidth.value === undefined || fixedHeight.value === undefined)
  const initial = computed(() => {
    const base = props.initialDimension ?? inheritedInitial?.value
    const width = fixedWidth.value ?? base?.width ?? 640
    const height = fixedHeight.value ?? base?.height ?? (props.aspect && props.aspect > 0 ? width / props.aspect : 360)
    return { width, height }
  })
  const effectiveWidth = computed(() => fixedWidth.value ?? (measured.value ? size.value.width : initial.value.width))
  const effectiveHeight = computed(() => fixedHeight.value ?? (measured.value ? size.value.height : initial.value.height))
  const hasValidSize = computed(() => validateWidthHeight({ width: effectiveWidth.value, height: effectiveHeight.value }))
  // The first measurement replaces the initial size; it is not a resize the user sees.
  provideChartSize(() => !isResponsive.value || measured.value ? `${effectiveWidth.value}x${effectiveHeight.value}` : undefined)
  /** Style of the measured box: fixed dimensions in px, the others fill the parent or follow `aspect`. */
  const boxStyle = computed<CSSProperties>(() => ({
    position: 'relative',
    cursor: 'default',
    width: fixedWidth.value === undefined ? '100%' : `${fixedWidth.value}px`,
    height: fixedHeight.value === undefined ? (props.aspect ? 'auto' : '100%') : `${fixedHeight.value}px`,
    aspectRatio: fixedHeight.value === undefined ? props.aspect : undefined,
  }))
  function handleResize(width: number, height: number) {
    const next = { width: fixedWidth.value ?? width, height: fixedHeight.value ?? height }
    // A hidden or not-yet-laid-out box must not erase the server geometry.
    if (!isResponsive.value || !validateWidthHeight(next))
      return
    setSize(next.width, next.height)
    measured.value = true
  }
  return { effectiveWidth, effectiveHeight, hasValidSize, handleResize, isResponsive, measured, boxStyle }
}
