import { defineComponent } from 'vue'

/** Plot bounds also sweep flat lines, whose object bounding box has zero height. */
export const SweepClip = defineComponent({
  props: {
    id: { type: String, required: true },
    progress: { type: Number, required: true },
    vertical: Boolean,
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  setup: props => () => (
    <clipPath id={props.id}>
      <rect x={props.x} y={props.y} width={props.width * (props.vertical ? 1 : props.progress)} height={props.height * (props.vertical ? props.progress : 1)} />
    </clipPath>
  ),
})
