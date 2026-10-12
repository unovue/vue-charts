import type { ChartDataKey } from '@/types/base'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { Layer } from '../../../container/Layer'
import Text from '../../../components/Text.vue'
import { getTextOfTick } from '../utils'

export const BrushText = defineComponent({
  name: 'BrushText',
  props: {
    startIndex: Number,
    endIndex: Number,
    y: Number,
    height: Number,
    travellerWidth: Number,
    stroke: String,
    tickFormatter: Function as PropType<(value: unknown, index: number) => number | string>,
    dataKey: [String, Function] as PropType<ChartDataKey>,
    data: Array as PropType<unknown[]>,
    startX: Number,
    endX: Number,
  },

  setup(props) {
    const offset = 5

    return () => {
      const attrs = {
        pointerEvents: 'none' as const,
        fill: 'var(--v-charts-text, #666)',
      }

      return (
        <Layer class="v-charts-brush-texts">
          <Text
            textAnchor="end"
            verticalAnchor="middle"
            x={Math.min(props.startX!, props.endX!) - offset}
            y={props.y! + props.height! / 2}
            value={getTextOfTick({
              index: props.startIndex!,
              tickFormatter: props.tickFormatter!,
              dataKey: props.dataKey,
              data: props.data,
            })}
            {...attrs}
          />
          <Text
            textAnchor="start"
            verticalAnchor="middle"
            x={Math.max(props.startX!, props.endX!) + props.travellerWidth! + offset}
            y={props.y! + props.height! / 2}
            value={getTextOfTick({
              index: props.endIndex!,
              tickFormatter: props.tickFormatter!,
              dataKey: props.dataKey,
              data: props.data,
            })}
            {...attrs}
          />
        </Layer>
      )
    }
  },
})
