import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { defineComponent, h, watch } from 'vue'
import type { DefineSetupFnComponent, ExtractPropTypes, PropType, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { LegendPropsWithSVG, LegendSlots } from './type'
import { LegendVueProps } from './type'
import { useLegend } from './hooks/useLegend'
import { useChartLegend } from '@/state/chartContext'
import { getLayoutForPosition } from './utils'
import { useLegendContent } from './hooks/useLegendContent'
import Surface from '@/container/Surface'
import { LegendSymbol, SIZE } from './LegendSymbol'

const LegendView = defineComponent({
  name: 'LegendView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof LegendVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
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
      handleClick,
      handleMouseEnter,
      handleMouseLeave,
    } = useLegendContent(props)

    const renderDefaultContent = () => {
      if (!processedPayload.value || processedPayload.value.length === 0) {
        return null
      }

      const { align = 'center', iconSize = 14 } = props
      const layout = resolvedLayout.value

      const finalStyle = {
        padding: 0,
        margin: 0,
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
                onClick={() => handleClick(entry, index)}
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClick(entry, index)
                  }
                }}
                onMouseenter={() => handleMouseEnter(entry, index)}
                onMouseleave={() => handleMouseLeave(entry, index)}
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
  props: LegendVueProps,
  setup(props, { attrs, slots }) {
    const { setLegendSettings } = useChartLegend()
    watch(() => ({
      layout: props.layout && props.layout !== 'auto' ? props.layout : getLayoutForPosition(props.position),
      align: props.align,
      verticalAlign: props.verticalAlign,
      position: props.position,
      offset: props.offset,
    }), setLegendSettings, { immediate: true })

    const View = useDeferredView(LegendView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
}) as unknown as DefineSetupFnComponent<LegendPropsWithSVG, {}, SlotsType<LegendSlots>>
