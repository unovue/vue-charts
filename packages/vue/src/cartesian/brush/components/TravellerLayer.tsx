import { computed, defineComponent } from 'vue'
import { Layer } from '../../../container/Layer'
import { Traveller } from './Traveller'
import type { BrushProps } from '../type'

export const TravellerLayer = defineComponent({
  name: 'TravellerLayer',
  props: {
    id: String,
    travellerX: Number,
    otherProps: Object as () => BrushProps & { y: number },
  },
  emits: [
    'mouseenter',
    'mouseleave',
    'mousedown',
    'touchstart',
    'traveller-move-keyboard',
    'focus',
    'blur',
  ],

  setup(props, { emit }) {
    const x = computed(() => Math.max(props.travellerX!, props.otherProps.x!))
    const travellerProps = computed(() => ({
      x: x.value,
      y: props.otherProps.y,
      width: props.otherProps.travellerWidth,
      height: props.otherProps.height,
      stroke: props.otherProps.stroke,
    }))

    const ariaLabelBrush = computed(() => {
      const { ariaLabel, data, startIndex, endIndex } = props.otherProps
      return ariaLabel || `Min value: ${data![startIndex!]?.name}, Max value: ${data![endIndex!]?.name}`
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      emit('traveller-move-keyboard', e.key === 'ArrowRight' ? 1 : -1, props.id)
    }

    return () => (
      <Layer
        tabindex={0}
        role="slider"
        aria-label={ariaLabelBrush.value}
        aria-valuenow={props.travellerX}
        class="v-charts-brush-traveller"
        onMouseenter={e => emit('mouseenter', e)}
        onMouseleave={e => emit('mouseleave', e)}
        onMousedown={e => emit('mousedown', e)}
        onTouchstart={e => emit('touchstart', e)}
        onKeydown={handleKeyDown}
        onFocus={() => emit('focus')}
        onBlur={() => emit('blur')}
        style={{ cursor: 'col-resize' }}
      >
        <Traveller {...travellerProps.value} />
      </Layer>
    )
  },
})
