import { defineComponent } from 'vue'

export const Traveller = defineComponent({
  name: 'Traveller',
  props: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    stroke: String,
  },

  setup(props) {
    return () => {
      const { x, y, width, height, stroke } = props
      const lineY = Math.floor(y! + height! / 2) - 1

      return (
        <>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={stroke}
            stroke="none"
          />
          <line
            x1={x! + 1}
            y1={lineY}
            x2={x! + width! - 1}
            y2={lineY}
            fill="none"
            stroke="var(--v-charts-background, #fff)"
          />
          <line
            x1={x! + 1}
            y1={lineY + 2}
            x2={x! + width! - 1}
            y2={lineY + 2}
            fill="none"
            stroke="var(--v-charts-background, #fff)"
          />
        </>
      )
    }
  },
})
