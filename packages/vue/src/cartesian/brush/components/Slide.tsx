import { computed, defineComponent } from 'vue'

export const Slide = defineComponent({
  name: 'Slide',
  props: {
    y: Number,
    height: Number,
    stroke: String,
    travellerWidth: Number,
    startX: Number,
    endX: Number,
  },
  emits: ['mouseenter', 'mouseleave', 'mousedown', 'touchstart'],

  setup(props, { emit }) {
    const x = computed(() => Math.min(props.startX!, props.endX!) + props.travellerWidth!)
    const width = computed(() => Math.max(Math.abs(props.endX! - props.startX!) - props.travellerWidth!, 0))

    return () => (
      <rect
        class="v-charts-brush-slide"
        onMouseenter={e => emit('mouseenter', e)}
        onMouseleave={e => emit('mouseleave', e)}
        onMousedown={e => emit('mousedown', e)}
        onTouchstart={e => emit('touchstart', e)}
        style={{ cursor: 'move' }}
        stroke="none"
        fill={props.stroke}
        fill-opacity={0.2}
        x={x.value}
        y={props.y}
        width={width.value}
        height={props.height}
      />
    )
  },
})
