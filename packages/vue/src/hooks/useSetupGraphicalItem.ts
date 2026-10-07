import { useChart } from '@/model/chart'
import { getSeriesId } from './useSeriesProps'
import { provideTooltipEntry } from '@/model/tooltip'
import type { Coordinate } from '@/types'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import type { Ref, ShallowRef } from 'vue'
import type { MinPointSize } from '@/types/shape'
import type { AreaInput } from '@/cartesian/area/type'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { CartesianGraphicalItemSettings, CartesianGraphicalItemType, ErrorBarsSettings } from '@/types/graphical'
import { getNormalizedStackId } from '@/core/coordinates'
import { getTooltipNameProp } from '@/core/tooltip'
import { computed } from 'vue'
import { mainColor } from '@/core/color'
import { useTrackedData } from './useTrackedData'
import type { AxisId } from '@/types/axisSettings'

type GraphicalItemProps = Partial<Pick<AreaInput, 'dataKey' | 'stackId' | 'hide' | 'xAxisId' | 'yAxisId'
  | 'stroke' | 'fill' | 'name' | 'legendType' | 'tooltipType' | 'unit'>> & {
    data?: readonly unknown[]
    strokeDasharray?: string | number
    strokeWidth?: string | number
    zAxisId?: AxisId
    barSize?: number | string
    minPointSize?: MinPointSize
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

  const legendPayload = computed<readonly LegendPayload[]>(() => {
    return [
      {
        inactive: props.hide,
        dataKey: props.dataKey,
        type: props.legendType,
        color: mainColor(type, props),
        value: getTooltipNameProp(props.name, props.dataKey)!,
        payload: {
          ...props,
          data: data.value,
        },
      },
    ]
  })
  const settings = computed<CartesianGraphicalItemSettings>(() => {
    return {
      seriesId: getSeriesId(props),
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
  })
  useChart().items.cartesian.register(settings)

  useChart().legend.entries.register(legendPayload)
  if (!options?.skipTooltip)
    useSetupTooltipEntry(props, type, data)
  return { data, settings }
}

export function useSetupTooltipEntry(
  props: GraphicalItemProps,
  type: CartesianGraphicalItemType,
  data: Readonly<Ref<readonly unknown[] | undefined>>,
  positions?: () => readonly Coordinate[] | undefined,
  model?: TooltipPayloadConfiguration['model'],
) {
  const entry = computed<TooltipPayloadConfiguration>(() => ({
    dataDefinedOnItem: data.value,
    positions: positions?.(),
    model,
    settings: {
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      fill: props.fill,
      dataKey: props.dataKey,
      nameKey: undefined,
      name: getTooltipNameProp(props.name, props.dataKey),
      hide: props.hide,
      type: props.tooltipType,
      color: mainColor(type, props),
      unit: props.unit,
    },
  }))
  useChart().tooltip.entries.register(entry)
  provideTooltipEntry(entry)
  return entry
}
