import { computed, defineComponent, h, shallowRef, watch } from 'vue'
import { useChart } from '@/model/chart'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import type { ExtractPropTypes, PropType, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { LegendHidden, LegendSlots } from './type'
import { LegendVueProps } from './type'
import { useLegend } from './hooks/useLegend'
import { getLayoutForPosition } from './utils'
import { useLegendContent } from './hooks/useLegendContent'
import Surface from '@/container/Surface'
import type { Size } from '@/types'
import { isOutsidePosition } from '@/cartesian/getCartesianPosition'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import { LegendSymbol, SIZE } from './LegendSymbol'

export type LegendBoundingBox = { width: number, height: number } | null

const legendItemEvent = (_entry: LegendPayload, _index: number, _event: MouseEvent | KeyboardEvent) => true
const legendEmits = {
  'update:hidden': (_hidden: LegendHidden) => true,
  'click': legendItemEvent,
  'mouseenter': legendItemEvent,
  'mouseleave': legendItemEvent,
  'bbox-update': (_box: LegendBoundingBox) => true,
}

const LegendView = defineComponent({
  name: 'LegendView',
  emits: legendEmits,
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof LegendVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots, emit }) {
    const teleport = useLayerTeleport()
    const props = view.item
    const attrs = view.svgAttrs
    const {
      legendRef,
      processedPayload,
      outerStyle,
      legendPortal,
      resolvedLayout,
      positionViewBox,
      boundingBox,
    } = useLegend(props)

    const {
      getItemStyle,
      getSvgStyle,
      formatValue,
    } = useLegendContent(props)

    watch(boundingBox, box => emit('bbox-update', box), { immediate: true })

    const activateItem = (entry: LegendPayload, index: number, event: MouseEvent | KeyboardEvent) => {
      if (props.hidden !== undefined && entry.dataKey !== undefined) {
        const key = String(entry.dataKey)
        const hidden = props.hidden.includes(key)
          ? props.hidden.filter(item => item !== key)
          : [...props.hidden, key]
        emit('update:hidden', hidden)
      }
      emit('click', entry, index, event)
    }

    const renderDefaultContent = () => {
      if (!processedPayload.value || processedPayload.value.length === 0) {
        return null
      }

      const { align = 'center', iconSize = 14 } = props
      const layout = resolvedLayout.value

      const finalStyle = {
        padding: '0px',
        margin: '0px',
        textAlign: layout === 'horizontal' ? align : ('left' as const),
      }

      return (
        <ul class="v-charts-default-legend" style={finalStyle}>
          {processedPayload.value.map((entry, index) => {
            if (entry.type === 'none') {
              return null
            }
            return (
              <li
                key={`legend-item-${index}`}
                class="v-charts-legend-item"
                style={getItemStyle(layout)}
                onMouseenter={(event: MouseEvent) => emit('mouseenter', entry, index, event)}
                onMouseleave={(event: MouseEvent) => emit('mouseleave', entry, index, event)}
              >
                <button
                  type="button"
                  aria-label={`Toggle ${formatValue(entry)} series`}
                  aria-pressed={!entry.inactive}
                  style={{
                    padding: 0,
                    border: 0,
                    background: 'none',
                    font: 'inherit',
                    color: 'var(--v-charts-text, #666)',
                    cursor: 'pointer',
                  }}
                  onClick={(event: MouseEvent) => activateItem(entry, index, event)}
                >
                  <Surface
                    width={iconSize}
                    height={iconSize}
                    viewBox={{
                      x: 0,
                      y: 0,
                      width: SIZE,
                      height: SIZE,
                    }}
                    style={getSvgStyle()}
                    aria-label={`${formatValue(entry)} legend icon`}
                  >
                    <LegendSymbol
                      type={props.iconType ?? entry.type}
                      color={entry.inactive ? 'var(--v-charts-inactive, #a3a3a3)' : entry.color}
                      size={iconSize}
                      data={entry}
                    />
                  </Surface>
                  <span class="v-charts-legend-item-text" style={{ color: 'var(--v-charts-text, #666)' }}>
                    {formatValue(entry)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )
    }

    const renderContent = () => {
      if (!processedPayload.value || processedPayload.value.length === 0) {
        return null
      }

      const contentProps = {
        ...props,
        layout: resolvedLayout.value,
        payload: processedPayload.value,
      }
      if (slots.content) {
        return slots.content(contentProps)
      }

      return renderDefaultContent()
    }

    return () => {
      if (props.position != null && positionViewBox.value == null) {
        return null
      }

      const legendElement = (
        <div
          data-slot="legend"
          class="v-charts-legend-wrapper"
          style={outerStyle.value}
          ref={legendRef}
        >
          {renderContent()}
        </div>
      )

      return (
        <foreignObject>
          {teleport(legendElement, legendPortal)}
        </foreignObject>
      )
    }
  },
})

const _Legend = defineComponent({
  name: 'Legend',
  inheritAttrs: false,
  emits: legendEmits,
  slots: Object as SlotsType<LegendSlots>,
  props: LegendVueProps,
  setup(props, { attrs, slots, emit }) {
    const measuredSize = shallowRef<Size>()
    useChart().legend.register(computed(() => ({
      hidden: props.hidden,
      size: props.portal == null && (props.position == null || isOutsidePosition(props.position))
        ? measuredSize.value
        : undefined,
      settings: {
        layout: props.layout && props.layout !== 'auto' ? props.layout : getLayoutForPosition(props.position),
        align: props.align,
        verticalAlign: props.verticalAlign,
        position: props.position,
        offset: props.offset,
      },
    })))

    const View = useDeferredView(LegendView)
    return () => h(View, {
      'item': props,
      'svgAttrs': attrs,
      'onUpdate:hidden': hidden => emit('update:hidden', hidden),
      'onClick': (entry, index, event) => emit('click', entry, index, event),
      'onMouseenter': (entry, index, event) => emit('mouseenter', entry, index, event),
      'onMouseleave': (entry, index, event) => emit('mouseleave', entry, index, event),
      'onBbox-update': (box) => {
        measuredSize.value = box ?? undefined
        emit('bbox-update', box)
      },
    }, slots)
  },
})

// Preserve template slot inference in published declarations.
const Legend: typeof _Legend & { new (): { $slots: LegendSlots } } = _Legend
export default Legend
