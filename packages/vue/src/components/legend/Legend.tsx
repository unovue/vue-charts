import type { DefineSetupFnComponent, SlotsType } from 'vue'
import { Teleport, defineComponent, watchEffect } from 'vue'
import type { LegendPropsWithSVG, LegendSlots } from './type'
import { LegendVueProps } from './type'
import { useLegend } from './hooks/useLegend'
import { useLegendContent } from './hooks/useLegendContent'
import Surface from '@/container/Surface'
import { LegendSymbol, SIZE } from './LegendSymbol'

export default defineComponent({
  name: 'Legend',
  props: LegendVueProps,
  setup(props, { slots }) {
    const {
      legendRef,
      processedPayload,
      outerStyle,
      legendPortal,
      resolvedLayout,
      positionViewBox,
      syncSettings,
      syncSize,
    } = useLegend(props)

    const {
      getItemStyle,
      getSvgStyle,
      formatValue,
      handleClick,
      handleMouseEnter,
      handleMouseLeave,
    } = useLegendContent(props)

    // Sync settings and size to store
    watchEffect(() => {
      syncSettings()
      syncSize()
    })

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
                    color={entry.inactive ? '#a3a3a3' : entry.color}
                    size={iconSize}
                    data={entry}
                  />
                </Surface>
                <span class="v-charts-legend-item-text" style={{ color: entry.inactive ? '#a3a3a3' : entry.color }}>
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
      if (legendPortal.value == null || (props.position != null && positionViewBox.value == null)) {
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
          <Teleport to={legendPortal.value}>
            {legendElement}
          </Teleport>
        </foreignObject>
      )
    }
  },
}) as unknown as DefineSetupFnComponent<LegendPropsWithSVG, {}, SlotsType<LegendSlots>>
