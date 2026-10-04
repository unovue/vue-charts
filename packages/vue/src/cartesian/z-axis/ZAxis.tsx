import { useChartCartesianAxis } from '@/state/chartContext'
import type { PropType } from 'vue'
import { defineComponent, onUnmounted, watch } from 'vue'
import type { ZAxisSettings } from '@/state/chartCartesianAxis'
import { implicitZAxis } from '@/state/selectors/axisSelectors'
import type { AxisRange } from '@/state/selectors/axisSelectors'
import type { DataKey } from '@/types'
import type { AxisDomain } from '@/types/axis'
import type { ScaleType } from '@/types/scale'

export const ZAxis = defineComponent({
  name: 'ZAxis',
  props: {
    zAxisId: {
      type: [String, Number] as PropType<string | number>,
      default: 0,
    },
    dataKey: {
      type: [String, Number, Function] as PropType<DataKey<any>>,
      default: undefined,
    },
    type: {
      type: String as PropType<'number' | 'category'>,
      default: implicitZAxis.type,
    },
    range: {
      type: Array as unknown as PropType<[number, number]>,
      default: () => implicitZAxis.range,
    },
    domain: {
      type: [Array, String] as PropType<AxisDomain>,
      default: undefined,
    },
    scale: {
      type: [String, Function] as PropType<ScaleType>,
      default: implicitZAxis.scale,
    },
    name: {
      type: String,
      default: undefined,
    },
    unit: {
      type: String,
      default: undefined,
    },
  },
  setup(props) {
    const { addZAxis, removeZAxis } = useChartCartesianAxis()

    let registeredSettings: ZAxisSettings | undefined
    watch((): ZAxisSettings => {
      return {
        id: props.zAxisId,
        dataKey: props.dataKey,
        type: props.type,
        range: props.range as AxisRange,
        domain: props.domain,
        scale: props.scale,
        name: props.name,
        unit: props.unit,
        allowDuplicatedCategory: implicitZAxis.allowDuplicatedCategory,
        allowDataOverflow: implicitZAxis.allowDataOverflow,
        reversed: implicitZAxis.reversed,
        includeHidden: implicitZAxis.includeHidden,
      }
    }, (settings) => {
      if (registeredSettings && registeredSettings.id !== settings.id)
        removeZAxis(registeredSettings)
      addZAxis(settings)
      registeredSettings = settings
    }, { immediate: true })
    onUnmounted(() => {
      if (registeredSettings)
        removeZAxis(registeredSettings)
    })

    return () => null
  },
})
