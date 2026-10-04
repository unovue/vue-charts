import type { SlotsType } from 'vue'
import { computed, defineComponent } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectUnfilteredCartesianItems } from '@/state/selectors/axisSelectors'
import { selectChartOffset } from '@/state/selectors/selectChartOffset'
import { useChartHeight, useChartWidth } from '@/context/chartLayoutContext'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '@/state/chartGraphicalItems'
import type { DataKey } from '@/types'

export interface FormattedGraphicalItem {
  type: string
  dataKey: DataKey<any> | undefined
  props: CartesianGraphicalItemSettings | PolarGraphicalItemSettings
}

export interface CustomizedSlotProps {
  formattedGraphicalItems: FormattedGraphicalItem[]
  chartWidth: number
  chartHeight: number
  offset: { top: number, right: number, bottom: number, left: number }
}

export interface CustomizedSlots {
  default?: (props: CustomizedSlotProps) => any
}

export const Customized = defineComponent({
  name: 'Customized',
  inheritAttrs: false,
  slots: Object as SlotsType<CustomizedSlots>,
  setup(_props, { slots }) {
    const chartWidth = useChartWidth()
    const chartHeight = useChartHeight()
    const offset = useAppSelector(selectChartOffset)
    const cartesianItems = useAppSelector(selectUnfilteredCartesianItems)
    const polarItems = useAppSelector(state => state.graphicalItems.polarItems)

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
