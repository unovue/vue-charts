import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { defineComponent, h, watch } from 'vue'
import type { ExtractPropTypes, PropType, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { LegendSlots } from './type'
import { LegendVueProps } from './type'
import { useLegend } from './hooks/useLegend'
import { useChartLegend } from '@/state/chartContext'
import { getLayoutForPosition } from './utils'
import { useLegendContent } from './hooks/useLegendContent'
import Surface from '@/container/Surface'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import { LegendSymbol, SIZE } from './LegendSymbol'

export type LegendBoundingBox = { width: number, height: number } | null

const legendItemEvent = (_entry: LegendPayload, _index: number, _event: MouseEvent | KeyboardEvent) => true
const legendEmits = {
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
      syncSize,
      boundingBox,
    } = useLegend(props)

    watch([resolvedLayout, () => props.align, () => props.verticalAlign, () => props.position, () => props.offset, () => props.portal, boundingBox], syncSize, { immediate: true })

    const {
      getItemStyle,
      getSvgStyle,
      formatValue,
    } = useLegendContent(props)

    watch(boundingBox, box => emit('bbox-update', box), { immediate: true })

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
                tabindex={0}
                role="button"
                aria-label={`Toggle ${formatValue(entry)} series`}
                onClick={(event: MouseEvent) => emit('click', entry, index, event)}
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    emit('click', entry, index, e)
                  }
                }}
                onMouseenter={(event: MouseEvent) => emit('mouseenter', entry, index, event)}
                onMouseleave={(event: MouseEvent) => emit('mouseleave', entry, index, event)}
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
                <span class="v-charts-legend-item-text" style={{ color: entry.inactive ? 'var(--v-charts-inactive, #a3a3a3)' : entry.color }}>
                  {formatValue(entry)}
                </span>
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

export default defineComponent({
  name: 'Legend',
  inheritAttrs: false,
  emits: legendEmits,
  slots: Object as SlotsType<LegendSlots>,
  props: LegendVueProps,
  setup(props, { attrs, slots, emit }) {
    const { setLegendSettings } = useChartLegend()
    watch(() => ({
      layout: props.layout && props.layout !== 'auto' ? props.layout : getLayoutForPosition(props.position),
      align: props.align,
      verticalAlign: props.verticalAlign,
      position: props.position,
      offset: props.offset,
    }), setLegendSettings, { immediate: true })

    const View = useDeferredView(LegendView)
    return () => h(View, {
      'item': props,
      'svgAttrs': attrs,
      'onClick': (entry, index, event) => emit('click', entry, index, event),
      'onMouseenter': (entry, index, event) => emit('mouseenter', entry, index, event),
      'onMouseleave': (entry, index, event) => emit('mouseleave', entry, index, event),
      'onBbox-update': box => emit('bbox-update', box),
    }, slots)
  },
})
