import type { PropType } from 'vue'
import { defineComponent, watch } from 'vue'
import { classProp } from '@/types'
import type { StackOffsetType, SyncMethod } from '@/types'
import { useChartRootProps } from '@/state/chartContext'

export default defineComponent({
  name: 'ReportChartProps',
  props: {
    accessibilityLayer: {
      type: Boolean,
      default: true,
    },
    barCategoryGap: {
      type: [Number, String],
      default: '10%',
    },
    barGap: {
      type: Number,
      default: 4,
    },
    barSize: {
      type: [String, Number],
      default: undefined,
    },
    class: classProp,
    maxBarSize: {
      type: Number,
      default: undefined,
    },
    stackOffset: {
      type: String as PropType<StackOffsetType>,
      default: 'none',
    },
    syncId: {
      type: [Number, String],
      default: undefined,
    },
    syncMethod: {
      type: [String, Function] as PropType<SyncMethod>,
      default: 'index',
    },
  },
  setup(props) {
    const { updateOptions } = useChartRootProps()

    watch(() => ({
      accessibilityLayer: props.accessibilityLayer,
      barCategoryGap: props.barCategoryGap,
      barGap: props.barGap,
      barSize: props.barSize,
      class: props.class,
      maxBarSize: props.maxBarSize,
      stackOffset: props.stackOffset,
      syncId: props.syncId,
      syncMethod: props.syncMethod,
    }), updateOptions, { immediate: true })

    return () => null
  },
})
