import type { AppliedChartData, ChartData, ChartDataState } from '@/types/chartData'
import type {
  CartesianGraphicalItemSettings,
  ErrorBarsSettings,
  GraphicalItemSettings,
  PolarGraphicalItemSettings,
} from '@/types/graphical'
import type { AxisId, AxisType, BaseCartesianAxis } from '@/types/axis'
import type { StackId } from '@/types/tick'
import { getValueByDataKey } from '@/core/data'
import { isNan, isNumOrStr, isWellBehavedNumber } from '@/utils/validate'

export function itemAxisPredicate(axisType: AxisType, axisId: AxisId) {
  return (item: CartesianGraphicalItemSettings | PolarGraphicalItemSettings) => {
    switch (axisType) {
      case 'xAxis':
        return 'xAxisId' in item && item.xAxisId === axisId
      case 'yAxis':
        return 'yAxisId' in item && item.yAxisId === axisId
      case 'zAxis':
        return 'zAxisId' in item && item.zAxisId === axisId
      case 'angleAxis':
        return 'angleAxisId' in item && item.angleAxisId === axisId
      case 'radiusAxis':
        return 'radiusAxisId' in item && item.radiusAxisId === axisId
      default:
        return false
    }
  }
}

export function graphicalItemsSettings<T extends GraphicalItemSettings>(
  graphicalItems: ReadonlyArray<T>,
  axisSettings: BaseCartesianAxis,
  axisPredicate: (item: T) => boolean | AxisType,
) {
  return graphicalItems.filter(axisPredicate).filter((item) => {
    if (axisSettings?.includeHidden === true) {
      return true
    }
    return !item.hide
  })
}

export function filterGraphicalNotStackedItems<T extends { stackId?: StackId }>(
  cartesianItems: ReadonlyArray<T>,
): ReadonlyArray<T> {
  return cartesianItems.filter(item => item.stackId === undefined)
}

export function graphicalItemsData(cartesianItems: ReadonlyArray<GraphicalItemSettings>) {
  return cartesianItems
    .map(item => item.data)
    .filter(Boolean)
    .flat(1)
}

export function displayedData(
  graphicalItemsData: ChartData,
  { chartData = [], dataStartIndex, dataEndIndex }: ChartDataState,
): ChartData {
  if (graphicalItemsData.length > 0) {
    // Brush ranges apply to chart data; series-owned data uses its full range.
    return graphicalItemsData
  }
  return chartData.slice(dataStartIndex, dataEndIndex + 1)
}

export function appliedValues(
  data: ChartData,
  axisSettings: BaseCartesianAxis,
  items: ReadonlyArray<GraphicalItemSettings>,
): AppliedChartData {
  if (axisSettings?.dataKey != null) {
    return data.map(item => ({ value: getValueByDataKey(item, axisSettings.dataKey!) }))
  }
  if (items.length > 0) {
    return items
      .map(item => item.dataKey)
      .flatMap(dataKey => data.map(entry => ({ value: getValueByDataKey(entry, dataKey!) })))
  }
  return data.map(entry => ({ value: entry }))
}

export function isErrorBarRelevantForAxisType(
  axisType: AxisType,
  errorBar: ErrorBarsSettings,
): boolean {
  switch (axisType) {
    case 'xAxis':
      return errorBar.direction === 'x'
    case 'yAxis':
      return errorBar.direction === 'y'
    default:
      return false
  }
}

export type AppliedChartDataWithErrorDomain = {
  /**
   * This is the value after the dataKey has been applied. Presumably a number? But no guarantees.
   */
  value: unknown
  /**
   * This is the error domain, if any, for the current value.
   * This may be either x or y direction, whatever is applicable.
   * Assumption is that we're looking at this data from the point of view of a single axis,
   * and that axis dictates the relevant direction.
   */
  errorDomain: ReadonlyArray<number> | undefined
}

export function onlyAllowNumbers(data: ReadonlyArray<unknown>): ReadonlyArray<number> {
  return data
    .filter(v => isNumOrStr(v) || v instanceof Date)
    .map(Number)
    .filter(Number.isFinite)
}

export function getErrorDomainByDataKey(
  entry: unknown,
  appliedValue: unknown,
  relevantErrorBars: ReadonlyArray<ErrorBarsSettings> | undefined,
): ReadonlyArray<number> {
  if (!relevantErrorBars || typeof appliedValue !== 'number' || isNan(appliedValue)) {
    return []
  }

  if (!relevantErrorBars.length) {
    return []
  }

  return onlyAllowNumbers(
    relevantErrorBars.flatMap((eb) => {
      const errorValue = getValueByDataKey(entry, eb.dataKey)
      let lowBound, highBound: unknown

      if (Array.isArray(errorValue)) {
        [lowBound, highBound] = errorValue
      }
      else {
        lowBound = highBound = errorValue
      }
      if (!isWellBehavedNumber(lowBound) || !isWellBehavedNumber(highBound)) {
        return undefined
      }
      return [appliedValue - lowBound, appliedValue + highBound]
    }),
  )
}

export function numericalValuesWithErrors(
  data: ChartData,
  axisSettings: BaseCartesianAxis,
  items: ReadonlyArray<GraphicalItemSettings & { errorBars?: ReadonlyArray<ErrorBarsSettings> }>,
  axisType: AxisType,
): ReadonlyArray<AppliedChartDataWithErrorDomain> {
  if (items.length > 0) {
    return data.flatMap(entry => items.map((item) => {
      const relevantErrorBars = item.errorBars?.filter(errorBar =>
        isErrorBarRelevantForAxisType(axisType, errorBar),
      )
      const value = getValueByDataKey(entry, axisSettings.dataKey || item.dataKey)
      return {
        value,
        errorDomain: getErrorDomainByDataKey(entry, value, relevantErrorBars),
      }
    }))
  }
  if (axisSettings?.dataKey != null) {
    return data.map(
      (item): AppliedChartDataWithErrorDomain => ({
        value: getValueByDataKey(item, axisSettings.dataKey!),
        errorDomain: [],
      }),
    )
  }
  return data.map((entry): AppliedChartDataWithErrorDomain => ({ value: entry, errorDomain: [] }))
}
