import { useId } from 'vue'

/** SSR-stable DOM id for `url(#...)` references. Call during setup. */
export function useChartId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^\w-]/g, '_')}`
}
