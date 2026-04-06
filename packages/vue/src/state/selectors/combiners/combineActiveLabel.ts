import { isNan } from '@/utils'
import type { TooltipIndex } from '../../tooltipSlice'
import type { TickItem } from '@/types'

export function combineActiveLabel(tooltipTicks: ReadonlyArray<TickItem>, activeIndex: TooltipIndex): string | number | undefined {
  const n = Number(activeIndex)
  if (isNan(n) || activeIndex == null) {
    return undefined
  }
  return n >= 0 ? tooltipTicks?.[n]?.value : undefined
}
