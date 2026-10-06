import type { AxisRange, AxisType } from '@/types/axis'
import type { AxisWithTicksSettings } from '@/types/axisSettings'
import type { ChartDataState } from '@/types/chartData'
import type { TooltipEntrySettings, TooltipIndex, TooltipPayload, TooltipPayloadConfiguration, TooltipPayloadEntry, TooltipPayloadSearcher } from '@/types/tooltip'
import type { ChartOffsetRequired, Coordinate, DataKey, LayoutType, Size, TickItem, TooltipEventType, ValueType } from '@/types'
import type { RechartsScale } from '@/types/scale'
import { isCategoricalAxis } from '@/utils/validate'
import { findEntryInArray, mathSign } from '@/utils/data'

import { getValueByDataKey } from '@/core/data'

export function sliceTooltipData<T>(
  arr: unknown | ReadonlyArray<T>,
  startIndex: number,
  endIndex: number,
): ReadonlyArray<T> | unknown {
  if (!Array.isArray(arr)) {
    return arr
  }
  if (arr && startIndex + endIndex !== 0) {
    return arr.slice(startIndex, endIndex + 1)
  }
  return arr
}
function dataForTooltip(dataDefinedOnItem: unknown, dataDefinedOnChart: ReadonlyArray<unknown>) {
  /*
   * If a payload has data specified directly from the graphical item, prefer that.
   * Otherwise, fill in data from the chart level, using the same index.
   */
  if (dataDefinedOnItem != null) {
    return dataDefinedOnItem
  }
  return dataDefinedOnChart
}

export function tooltipPayload(tooltipPayloadConfigurations: ReadonlyArray<TooltipPayloadConfiguration>, activeIndex: TooltipIndex, chartDataState: ChartDataState, tooltipAxis: Pick<AxisWithTicksSettings, 'dataKey' | 'allowDuplicatedCategory'> | undefined, activeLabel: string | number | undefined, tooltipPayloadSearcher: TooltipPayloadSearcher | undefined, tooltipEventType: TooltipEventType | undefined): TooltipPayload | undefined {
  if (activeIndex == null || tooltipPayloadSearcher == null) {
    return undefined
  }
  const { chartData, dataStartIndex, dataEndIndex } = chartDataState

  const init: Array<TooltipPayloadEntry> = []

  return tooltipPayloadConfigurations.reduce((agg, { dataDefinedOnItem, settings, values }): Array<TooltipPayloadEntry> => {
    const finalData = dataForTooltip(dataDefinedOnItem, chartData!)

    const sliced = sliceTooltipData(finalData, dataStartIndex, dataEndIndex)

    const finalDataKey = settings?.dataKey ?? tooltipAxis?.dataKey
    const finalNameKey = settings?.nameKey
    let tooltipPayload: unknown
    if (
      tooltipAxis?.dataKey
      && !tooltipAxis?.allowDuplicatedCategory
      && Array.isArray(sliced)
      && activeLabel != null
      /*
       * If the tooltipEventType is 'axis', we should search for the dataKey in the sliced data
       * because thanks to allowDuplicatedCategory=false, the order of elements in the array
       * no longer matches the order of elements in the original data
       * and so we need to search by the active dataKey + label rather than by index.
       *
       * On the other hand the tooltipEventType 'item' should always search by index
       * because we get the index from interacting over the individual elements
       * which is always accurate, irrespective of the allowDuplicatedCategory setting.
       */
      && tooltipEventType === 'axis'
    ) {
      tooltipPayload = findEntryInArray(sliced, tooltipAxis.dataKey, activeLabel)
    }
    // Fall back to index-based search if findEntryInArray didn't find a match
    // (e.g. scatter tooltip data where items are TooltipPayloadEntry arrays, not raw data objects)
    if (tooltipPayload == null) {
      tooltipPayload = tooltipPayloadSearcher(sliced, activeIndex, finalNameKey)
    }

    if (Array.isArray(tooltipPayload)) {
      tooltipPayload.forEach((item) => {
        const newSettings: TooltipEntrySettings = {
          ...settings,
          name: item.name,
          unit: item.unit,
          color: undefined,
          fill: undefined,
        }
        agg.push(
          getTooltipEntry({
            tooltipEntrySettings: newSettings,
            dataKey: item.dataKey,
            payload: item.payload,
            value: getValueByDataKey(item.payload, item.dataKey),
            name: item.name,
          }),
        )
      })
    }
    else {
      agg.push(
        getTooltipEntry({
          tooltipEntrySettings: settings,
          dataKey: finalDataKey!,
          payload: tooltipPayload,
          value: values?.[activeIndex] ?? getValueByDataKey(tooltipPayload, finalDataKey),
          name: getValueByDataKey(tooltipPayload, finalNameKey) ?? settings?.name,
        }),
      )
    }
    return agg
  }, init)
}

export function tooltipTicks(layout: LayoutType, axis: AxisWithTicksSettings, realScaleType: string | undefined, scale: RechartsScale | undefined, range: AxisRange | undefined, duplicateDomain: ReadonlyArray<unknown> | undefined, categoricalDomain: ReadonlyArray<unknown> | undefined, axisType: Exclude<AxisType, 'zAxis'>): ReadonlyArray<TickItem> | null {
  if (!axis) {
    return null
  }
  const { type } = axis

  const isCategorical = isCategoricalAxis(layout, axisType)

  if (!scale) {
    return null
  }

  const offsetForBand = realScaleType === 'scaleBand' && scale.bandwidth ? scale.bandwidth() / 2 : 2
  let offset = type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0

  offset
    = axisType === 'angleAxis' && range != null && range?.length >= 2
      ? mathSign(range[0] - range[1]) * 2 * offset
      : offset

  // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
  if (isCategorical && categoricalDomain) {
    return categoricalDomain.map(
      (entry, index: number): TickItem => ({
        coordinate: scale(entry) + offset,
        value: entry,
        index,
        offset,
      }),
    )
  }

  // When axis has duplicated text, serial numbers are used to generate scale
  return scale.domain().map(
    (entry, index: number): TickItem => ({
      coordinate: scale(entry) + offset,
      value: duplicateDomain ? duplicateDomain[entry as number] : entry,
      index,
      offset,
    }),
  )
}

export function parseTooltipIndex(value: string | number | null | undefined): number | null {
  if (value == null || (typeof value === 'string' && !/^(?:0|[1-9]\d*)$/.test(value)))
    return null
  const index = Number(value)
  return Number.isSafeInteger(index) && index >= 0 ? index : null
}
export function getTooltipEntry({
  tooltipEntrySettings,
  dataKey,
  payload,
  value,
  name,
}: {
  tooltipEntrySettings: TooltipEntrySettings
  dataKey: DataKey<unknown>
  payload: unknown
  value: ValueType
  name: string | undefined
}): TooltipPayloadEntry {
  return {
    ...tooltipEntrySettings,
    dataKey,
    payload,
    value,
    name,
  }
}

export function tooltipCoordinate(
  type: TooltipEventType,
  layout: LayoutType,
  tick: TickItem | undefined,
  size: Size,
  offset: ChartOffsetRequired,
  position: Coordinate | undefined,
  fallback: Coordinate | undefined,
): Coordinate | undefined {
  if (position)
    return position
  if (type === 'item')
    return fallback
  if (!tick)
    return undefined
  return layout === 'horizontal'
    ? { ...fallback, x: tick.coordinate, y: fallback?.y ?? (offset.top + size.height) / 2 }
    : { ...fallback, x: fallback?.x ?? (offset.left + size.width) / 2, y: tick.coordinate }
}

export function getTooltipNameProp(
  nameFromItem: unknown,
  dataKey: DataKey<unknown> | undefined,
): string | undefined {
  if (nameFromItem) {
    return String(nameFromItem)
  }
  if (typeof dataKey === 'string') {
    return dataKey
  }
  return undefined
}
