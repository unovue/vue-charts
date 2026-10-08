import { useChart } from '@/model/chart'
import { getSeriesId } from './useSeriesProps'
import { provideTooltipEntry } from '@/model/tooltip'
import type { Coordinate } from '@/types'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import type { Ref, ShallowRef } from 'vue'
import type { MinPointSize } from '@/types/shape'
import type { AreaInput } from '@/cartesian/area/type'
import type { LegendPayload } from '@/types/legend'
import type { CartesianGraphicalItemSettings, CartesianGraphicalItemType, ErrorBarsSettings, PolarGraphicalItemSettings } from '@/types/graphical'
import type { ChartDataKey } from '@/types/base'
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

/**
 * Registers a polar series (Pie, Radar, RadialBar, Funnel) and its legend items. The hook owns
 * the shared fields: the series type, its dataKey, and `hide`, which also marks the legend
 * items inactive. `settings` adds the series' own fields (axis ids, bar sizing, data).
 */
export function useSetupPolarItem(
  props: { dataKey: ChartDataKey, hide: boolean },
  type: PolarGraphicalItemSettings['type'],
  options: {
    settings?: () => Partial<Omit<PolarGraphicalItemSettings, 'type' | 'dataKey' | 'hide'>>
    legend: () => readonly Omit<LegendPayload, 'dataKey' | 'inactive'>[]
  },
) {
  const chart = useChart()
  chart.items.polar.register(computed<PolarGraphicalItemSettings>(() => ({
    data: undefined,
    stackId: undefined,
    barSize: undefined,
    angleAxisId: 0,
    radiusAxisId: 0,
    ...options.settings?.(),
    type,
    dataKey: props.dataKey,
    hide: props.hide,
  })))
  chart.legend.entries.register(computed(() => options.legend().map(entry => ({ ...entry, dataKey: props.dataKey, inactive: props.hide }))))
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
