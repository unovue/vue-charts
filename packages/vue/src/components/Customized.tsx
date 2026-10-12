import type { ChartDataKey } from '@/types/base'
import type { SlotsType, VNodeChild } from 'vue'
import { useChart } from '@/model/chart'
import { warnOnce } from '@/utils/log'
import { computed, defineComponent } from 'vue'
import { useChartPresentation } from '@/model/presentation'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '@/types/graphical'

interface FormattedGraphicalItem {
  type: string
  dataKey: ChartDataKey | undefined
  props: CartesianGraphicalItemSettings | PolarGraphicalItemSettings
}

export interface CustomizedSlotProps {
  formattedGraphicalItems: FormattedGraphicalItem[]
  chartWidth: number
  chartHeight: number
  offset: { top: number, right: number, bottom: number, left: number }
}

export interface CustomizedSlots {
  default?: (props: CustomizedSlotProps) => VNodeChild
}

/**
 * @deprecated Use the chart's default slot with `usePlotArea()` and the other chart composables.
 * Removed in 2.0 (see internals/migrations.md).
 */
export const Customized = defineComponent({
  name: 'Customized',
  inheritAttrs: false,
  slots: Object as SlotsType<CustomizedSlots>,
  setup(_props, { slots }) {
    warnOnce('[vccs] Customized is deprecated and will be removed in 2.0. Use the chart\'s default slot with usePlotArea() and the other chart composables.')
    const chart = useChart()
    const chartWidth = useChartPresentation().width
    const chartHeight = useChartPresentation().height
    const offset = chart.offset
    const cartesianItems = chart.items.cartesian.entries
    const polarItems = chart.items.polar.entries

    const formattedGraphicalItems = computed<FormattedGraphicalItem[]>(() => {
      const items: FormattedGraphicalItem[] = []
      for (const item of cartesianItems.value) {
        items.push({
          type: item.type,
          dataKey: item.dataKey,
          props: item,
        })
      }
      for (const item of polarItems.value) {
        items.push({
          type: item.type,
          dataKey: item.dataKey,
          props: item,
        })
      }
      return items
    })

    return () => {
      if (!slots.default)
        return null

      return slots.default({
        formattedGraphicalItems: formattedGraphicalItems.value,
        chartWidth: chartWidth.value,
        chartHeight: chartHeight.value,
        offset: offset.value,
      })
    }
  },
})
