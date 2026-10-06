import { getTextOfTick } from '../utils'
import { computed, defineComponent } from 'vue'
import { Layer } from '../../../container/Layer'
import { Traveller } from './Traveller'
import type { BrushProps, BrushStartEndIndex } from '../type'

export const TravellerLayer = defineComponent({
  name: 'TravellerLayer',
  props: {
    id: String,
    travellerX: Number,
    otherProps: { type: Object as () => BrushProps & BrushStartEndIndex & { y: number }, required: true },
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

    const index = computed(() => props.id === 'startX'
      ? props.otherProps.startIndex
      : props.otherProps.endIndex)
    const category = computed(() => getTextOfTick({
      index: index.value!,
      data: props.otherProps.data,
      dataKey: props.otherProps.dataKey,
      tickFormatter: props.otherProps.tickFormatter,
    }))

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
        aria-label={props.id === 'startX' ? 'Range start' : 'Range end'}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, (props.otherProps.data?.length ?? 0) - 1)}
        aria-valuenow={index.value}
        aria-valuetext={String(category.value ?? '')}
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
