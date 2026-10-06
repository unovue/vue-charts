import { useChart } from '@/model/chart'
import { provideTooltipEntry } from '@/model/tooltip'
import type { Coordinate } from '@/types'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import type { Ref, SVGAttributes, ShallowRef } from 'vue'
import type { MinPointSize } from '@/shape'
import type { AreaProps } from '@/cartesian/area/type'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { CartesianGraphicalItemType, ErrorBarsSettings } from '@/types/graphical'
import { getNormalizedStackId } from '@/core/coordinates'
import { getTooltipNameProp } from '@/core/tooltip'
import { computed, useAttrs } from 'vue'
import { useTrackedData } from './useTrackedData'
import type { AxisId } from '@/types/axisSettings'

type GraphicalItemProps = Partial<Pick<AreaProps, 'dataKey' | 'stackId' | 'hide' | 'xAxisId' | 'yAxisId'
  | 'stroke' | 'fill' | 'name' | 'legendType' | 'tooltipType' | 'unit'>> & {
    data?: readonly unknown[]
    strokeDasharray?: string | number
    zAxisId?: AxisId
    barSize?: number | string
    minPointSize?: MinPointSize
  }

function getItemColor(type: CartesianGraphicalItemType, stroke: string | undefined, fill: string | undefined): string | undefined {
  // Bar's primary visual is fill, not stroke
  if (type === 'bar') {
    return fill
  }
  // Area/Line primary visual is stroke
  return stroke && stroke !== 'none' ? stroke : fill
}

export function useSetupGraphicalItem(
  props: GraphicalItemProps,
  type: CartesianGraphicalItemType,
  options?: {
    skipTooltip?: boolean
    errorBars?: ShallowRef<ReadonlyArray<ErrorBarsSettings>>
  },
) {
  const data = useTrackedData<unknown>(() => props.data)
  const attrs = useAttrs() as SVGAttributes

  const legendPayload = computed<readonly LegendPayload[]>(() => {
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
    ]
  })
  useChart().items.cartesian.register(computed(() => {
    return {
      data: data.value,
      dataKey: props.dataKey,
      stackId: getNormalizedStackId(props.stackId),
      hide: props.hide ?? false,
      xAxisId: props.xAxisId ?? 0,
      yAxisId: props.yAxisId ?? 0,
      zAxisId: props.zAxisId,
      barSize: props.barSize,
      minPointSize: props.minPointSize,
      type,
      errorBars: options?.errorBars?.value,
    }
  }))

  useChart().legend.entries.register(legendPayload)
  if (!options?.skipTooltip)
    useSetupTooltipEntry(props, type, data)
  return data
}

export function useSetupTooltipEntry(
  props: GraphicalItemProps,
  type: CartesianGraphicalItemType,
  data: Readonly<Ref<readonly unknown[] | undefined>>,
  positions?: () => readonly Coordinate[] | undefined,
  model?: TooltipPayloadConfiguration['model'],
  svgAttrs?: SVGAttributes,
) {
  const attrs = svgAttrs ?? useAttrs() as SVGAttributes
  const entry = computed<TooltipPayloadConfiguration>(() => ({
    dataDefinedOnItem: data.value,
    positions: positions?.(),
    model,
    settings: {
      stroke: attrs.stroke ?? props.stroke,
      strokeWidth: attrs['stroke-width'],
      fill: attrs.fill ?? props.fill,
      dataKey: props.dataKey,
      nameKey: undefined,
      name: getTooltipNameProp(props.name, props.dataKey),
      hide: props.hide,
      type: props.tooltipType,
      color: getItemColor(type, attrs.stroke ?? props.stroke, attrs.fill ?? props.fill),
      unit: props.unit,
    },
  }))
  useChart().tooltip.entries.register(entry)
  provideTooltipEntry(entry)
  return entry
}
