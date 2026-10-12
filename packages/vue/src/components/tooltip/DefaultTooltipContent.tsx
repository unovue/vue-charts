import type { CSSProperties, PropType, VNodeChild } from 'vue'
import { defineComponent, isVNode } from 'vue'
import type { Formatter, TooltipPayload } from '@/types/tooltip'
import type {
  NameType,
  Payload,
  ValueType,
} from '@/types'
import { sortBy } from 'es-toolkit/compat'
import { isNumOrStr } from '@/utils'

function defaultFormatter<TValue extends ValueType>(value: TValue) {
  return Array.isArray(value) && isNumOrStr(value[0]) && isNumOrStr(value[1]) ? (value.join(' ~ ') as TValue) : value
}
/**
 * What the default content can print: text, numbers, booleans and nodes. Other values (objects
 * in messy data) print nothing instead of "[object Object]" or, for objects without a
 * prototype, a crash.
 */
function printable(value: unknown): unknown {
  if (value == null || typeof value !== 'object' || isVNode(value))
    return value
  return Array.isArray(value) ? value.map(printable) : undefined
}

// Default Tooltip Content Component
export const DefaultTooltipContent = defineComponent({
  name: 'DefaultTooltipContent',
  // It receives the whole tooltip state; none of it belongs on the element.
  inheritAttrs: false,
  props: {
    label: [String, Number],
    payload: Array as PropType<TooltipPayload>,
    active: Boolean,
    separator: { type: String, default: ' : ' },
    contentStyle: Object,
    labelStyle: Object,
    itemStyle: Object,
    itemSorter: [Function, String] as PropType<((item: Payload<ValueType, NameType>) => number | string) | 'dataKey' | 'value' | 'name'>,
    formatter: Function as PropType<Formatter<ValueType, NameType>>,
    labelFormatter: Function as PropType<(label: string | number | undefined, payload: TooltipPayload) => VNodeChild>,
  },
  setup(props) {
    return () => {
      if (!props.active || !props.payload?.length)
        return null
      const { contentStyle, labelStyle, itemStyle } = props
      const finalStyle: CSSProperties = {
        margin: 0,
        padding: '10px',
        backgroundColor: 'var(--v-charts-tooltip-background, #fff)',
        color: 'var(--v-charts-tooltip-foreground, #000)',
        border: '1px solid var(--v-charts-tooltip-border, #ccc)',
        whiteSpace: 'nowrap',
        ...contentStyle,
      }
      const finalLabelStyle = {
        margin: 0,
        ...labelStyle,
      }
      const { itemSorter, payload, formatter } = props
      const sortedPayload = itemSorter ? sortBy(payload, itemSorter) : payload
      const label = props.labelFormatter ? props.labelFormatter(props.label, payload) : props.label
      const hasLabel = props.labelFormatter ? label != null : !!props.label
      return (
        <div class="v-charts-tooltip-content" style={finalStyle}>
          {hasLabel && (
            <div class="v-charts-tooltip-label" style={finalLabelStyle}>
              {printable(label)}
            </div>
          )}
          <div class="v-charts-tooltip-list">
            {sortedPayload.map((entry, index) => {
              const finalItemStyle = {
                display: 'block',
                paddingTop: 4,
                paddingBottom: 4,
                color: 'var(--v-charts-tooltip-foreground, #000)',
                ...itemStyle,
              }
              // A chart's entry formatter is a default; the Tooltip's own formatter replaces it.
              const finalFormatter = formatter || entry.formatter || defaultFormatter
              const { value, name } = entry
              let finalValue: VNodeChild = value
              let finalName: VNodeChild = name
              if (finalFormatter) {
                const formatted = finalFormatter(value!, name!, entry, index, payload)
                if (Array.isArray(formatted)) {
                  [finalValue, finalName] = formatted
                }
                else if (formatted != null) {
                  finalValue = formatted
                }
                else {
                  return null
                }
              }
              return (
                <div key={index} class="v-charts-tooltip-item" style={finalItemStyle}>
                  <span
                    class="v-charts-tooltip-swatch"
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      marginRight: '4px',
                      background: entry.color,
                    }}
                  />
                  <span class="v-charts-tooltip-item-name">
                    {printable(entry.name)}
                  </span>
                  <span class="v-charts-tooltip-separator">{props.separator}</span>
                  <span class="v-charts-tooltip-item-value">
                    {printable(finalValue)}
                  </span>
                  <span class="v-charts-tooltip-item-unit">{entry.unit || ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  },
})
