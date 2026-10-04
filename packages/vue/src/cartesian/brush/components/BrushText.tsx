import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { Layer } from '../../../container/Layer'
import Text from '../../../components/Text.vue'
import { getTextOfTick } from '../utils'
import type { DataKey } from '../../../types/common'

export const BrushText = defineComponent({
  name: 'BrushText',
  props: {
    startIndex: Number,
    endIndex: Number,
    y: Number,
    height: Number,
    travellerWidth: Number,
    stroke: String,
    tickFormatter: Function as PropType<(value: any, index: number) => number | string>,
    dataKey: [String, Function] as PropType<DataKey<any>>,
    data: Array as PropType<any[]>,
    startX: Number,
    endX: Number,
  },

  setup(props) {
    const offset = 5

    return () => {
      const attrs = {
        pointerEvents: 'none' as const,
        fill: props.stroke,
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
