import { type ComputedRef, computed } from 'vue'
import type { CategoricalChartPropsWithOutSvg } from '@/chart/generateCategoricalChart'
import { useRoundedSize } from '@/hooks/useRoundedSize'
import { validateWidthHeight } from '@/utils'

type ResponsiveSizeProps = Pick<CategoricalChartPropsWithOutSvg, 'responsive' | 'width' | 'height'>

interface UseResponsiveSizeResult {
  /** Final width: measured from the wrapper when `responsive`, otherwise from props. */
  effectiveWidth: ComputedRef<number>
  /** Final height: measured from the wrapper when `responsive`, otherwise from props. */
  effectiveHeight: ComputedRef<number>
  /** Whether the effective size passes validateWidthHeight. Render policy is the caller's decision. */
  hasValidSize: ComputedRef<boolean>
  /** Feeds the wrapper's ResizeObserver callback. Rounds and ignores no-change updates. */
  handleResize: (width: number, height: number) => void
}

/**
 * Owns the chart's size resolution: in responsive mode the size is measured
 * from the wrapper div (via `handleResize`), otherwise it comes from props.
 *
 * Render gating (`return null` when the size is invalid) stays with the
 * caller — the rules differ between the compact and normal branches.
 */
export function useResponsiveSize(props: ResponsiveSizeProps): UseResponsiveSizeResult {
  // Size measured from the wrapper div when `responsive` is enabled.
  const { size: responsiveSize, setSize: handleResize } = useRoundedSize()

  // `?? 0`: absent props yield 0, which validateWidthHeight rejects — the
  // hasValidSize gate keeps every consumer on the valid path, so the number
  // type is honored inside the hook rather than asserted.
  const effectiveWidth = computed(() => (props.responsive ? responsiveSize.value.width : props.width ?? 0))
  const effectiveHeight = computed(() => (props.responsive ? responsiveSize.value.height : props.height ?? 0))
  const hasValidSize = computed(() => validateWidthHeight({ width: effectiveWidth.value, height: effectiveHeight.value }))

  return { effectiveWidth, effectiveHeight, hasValidSize, handleResize }
}
