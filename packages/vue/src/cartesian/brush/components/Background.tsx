import { defineComponent } from 'vue'

export const Background = defineComponent({
  name: 'Background',
  props: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    fill: String,
    stroke: String,
  },

  setup(props) {
    return () => (
      <rect
        stroke={props.stroke}
        fill={props.fill}
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
      />
    )
  },
})
