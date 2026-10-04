import type { AreaProps, AreaPropsWithSVG } from '@/cartesian/area/type'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import type { CartesianGraphicalItemType, ErrorBarsSettings } from '@/state/graphicalItemsSlice'
import { SetCartesianGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { getTooltipNameProp } from '@/utils/chart'
import type { SVGAttributes, ShallowRef } from 'vue'
import { computed, useAttrs } from 'vue'
import { useTrackedData } from './useTrackedData'

function getLegendItemColor(stroke: string | undefined, fill: string): string {
  return stroke && stroke !== 'none' ? stroke : fill
}

function getItemColor(type: CartesianGraphicalItemType, stroke: string | undefined, fill: string | undefined): string | undefined {
  // Bar's primary visual is fill, not stroke
  if (type === 'bar') {
    return fill
  }
  // Area/Line primary visual is stroke
  return getLegendItemColor(stroke, fill!)
}

export function useSetupGraphicalItem(props: AreaProps | any, type: CartesianGraphicalItemType, options?: { skipTooltip?: boolean, errorBars?: ShallowRef<ReadonlyArray<ErrorBarsSettings>> }) {
  const data = useTrackedData<unknown>(() => props.data)
  const attrs = useAttrs() as SVGAttributes
  const isPanorama = useIsPanorama()
  const legendPayload = computed(() => {
    return [
      {
        inactive: props.hide,
        dataKey: props.dataKey,
        type: props.legendType,
        color: getItemColor(type, attrs.stroke ?? props.stroke, attrs.fill ?? props.fill),
        value: getTooltipNameProp(props.name, props.dataKey)!,
        payload: {
          ...props,
          data: data.value,
        },
      },
    ] as ReadonlyArray<LegendPayload>
  })
  SetCartesianGraphicalItem(computed(() => {
    return {
      ...props,
      data: data.value,
      isPanorama,
      type,
      errorBars: options?.errorBars?.value,
    }
  }))

  SetLegendPayload(legendPayload)
  if (!options?.skipTooltip) {
    SetTooltipEntrySettings({ fn: getTooltipEntrySettings as any, args: computed(() => ({
      ...props,
      data: data.value,
      ...attrs,
      _itemType: type,
    } as AreaPropsWithSVG | any)) })
  }
  return data
}

function getTooltipEntrySettings(props: AreaPropsWithSVG & { _itemType?: CartesianGraphicalItemType } | any) {
  const { dataKey, data, stroke, fill, name, hide, unit, _itemType } = props
  return {
    dataDefinedOnItem: data,
    positions: undefined,
    settings: {
      stroke,
      strokeWidth: props['stroke-width'],
      fill,
      dataKey,
      nameKey: undefined,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: props.tooltipType,
      color: getItemColor(_itemType!, stroke, fill),
      unit,
    },
  }
}
