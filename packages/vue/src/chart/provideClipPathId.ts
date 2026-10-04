import { useChartId } from '@/hooks/useChartId'
import { createContext } from '@/utils/createContext'
import type { CategoricalChartProps } from '@/types'

// Create context for clipPathId
const [useClipPathId, provideClipPathIdRaw] = createContext<string>(
  'clipPathId',
)

/**
 * Provide the clipPathId to child components.
 * @param props - The props object from the chart component
 */
export function provideClipPathId(props: CategoricalChartProps) {
  const generatedId = useChartId('v-charts')
  const clipPathId = `${props.id ?? generatedId}-clip`
  provideClipPathIdRaw(clipPathId)
  return clipPathId
}

/**
 * Inject the clipPathId provided by an ancestor chart component.
 * @returns {string} The injected clipPathId
 */
export { useClipPathId }
