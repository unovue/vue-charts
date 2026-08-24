import { ref } from 'vue'

export interface RoundedSize {
  width: number
  height: number
}

/**
 * Shared size-state core: a size ref plus a setter that rounds to
 * integers and ignores no-change updates.
 *
 * Adapters: `useResponsiveSize` (chart sizing) and `ResponsiveContainer`.
 * ResponsiveContainer is planned for removal (see ADR-0001); when it goes,
 * this module stays behind as the chart's size-state implementation.
 */
export function useRoundedSize(initial: RoundedSize = { width: 0, height: 0 }) {
  const size = ref(initial)

  function setSize(width: number, height: number) {
    const roundedWidth = Math.round(width)
    const roundedHeight = Math.round(height)
    if (size.value.width === roundedWidth && size.value.height === roundedHeight) {
      return
    }
    size.value = { width: roundedWidth, height: roundedHeight }
  }

  return { size, setSize }
}
