import { useAppSelector } from './chartContext'
import { selectActiveTooltipDataPoints } from '@/state/selectors/tooltipSelectors'

export { useAppSelector } from './chartContext'

/**
 * Returns the currently active data points being displayed in the Tooltip.
 * Active means that it is currently visible; this hook will return `undefined` if there is no current interaction.
 *
 * This follows the `<Tooltip />` props, if the Tooltip element is present in the chart.
 * If there is no `<Tooltip />` then this hook will follow the default Tooltip props.
 *
 * Data point is whatever you pass as an input to the chart using the `data={}` prop.
 *
 * This returns an array because a chart can have multiple graphical items in it (multiple Lines for example)
 * and tooltip with `shared={true}` will display all items at the same time.
 *
 * Returns undefined when used outside a chart context.
 *
 * @returns Data points that are currently visible in a Tooltip
 */
export function useActiveTooltipDataPoints() {
  return useAppSelector(selectActiveTooltipDataPoints)
}
