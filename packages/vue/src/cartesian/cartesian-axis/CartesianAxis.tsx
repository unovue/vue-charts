/**
 * @fileOverview Cartesian Axis
 */
import type { CartesianViewBox } from '@/cartesian/type'
import type { VueClassValue } from '@/types/common'
import type { AxisInterval } from '@/types/axis'
import type { RechartsScale } from '@/types/scale'
import type { CartesianTickItem } from '@/types/tick'
import type { ComponentPublicInstance, PropType, SVGAttributes } from 'vue'
import { isNumber } from '@/utils'
import { filterProps } from '@/utils/VueUtils'
import { defineComponent, reactive, ref } from 'vue'
import { get } from 'es-toolkit/compat'
import Text from '@/components/Text.vue'
import { Label } from '@/components/label'
import { Layer } from '@/container/Layer'
import { getTicks } from '@/cartesian/utils/get-ticks'

/** The orientation of the axis in correspondence to the chart */
export type Orientation = 'top' | 'bottom' | 'left' | 'right'
/** A unit to be appended to a value */
export type Unit = string | number
/** The formatter function of tick */
export type TickFormatter = (value: any, index: number) => string

export interface CartesianAxisProps {
  class?: VueClassValue
  x?: number
  y?: number
  width?: number
  height?: number
  unit?: Unit
  orientation?: Orientation
  viewBox?: CartesianViewBox
  mirror?: boolean
  tickMargin?: number
  hide?: boolean
  label?: any
  minTickGap?: number
  ticks?: ReadonlyArray<CartesianTickItem>
  tickSize?: number
  tickFormatter?: TickFormatter
  interval?: AxisInterval
  angle?: number
  scale: RechartsScale
  axisLine?: boolean | SVGAttributes
}

export const CartesianAxis = defineComponent({
  name: 'CartesianAxis',
  props: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    unit: [String, Number],
    orientation: { type: String, default: 'bottom' },
    viewBox: { type: Object, default: () => ({ x: 0, y: 0, width: 0, height: 0 }) },
    tick: { type: Boolean, default: true },
    axisLine: { type: [Boolean, Object] as PropType<boolean | SVGAttributes>, default: () => true },
    tickLine: { type: [Boolean, Object], default: () => true },
    mirror: { type: Boolean, default: false },
    tickMargin: { type: Number, default: 2 },
    hide: Boolean,
    label: null,
    minTickGap: { type: Number, default: 5 },
    ticks: { type: Array as PropType<ReadonlyArray<CartesianTickItem>>, default: () => [] },
    tickSize: { type: Number, default: 6 },
    tickFormatter: Function,
    interval: { type: [String, Number], default: 'preserveEnd' },
    angle: Number,
    scale: { type: [Function] as PropType<RechartsScale> },
    stroke: { type: String, default: '#666' },
    /** Additional props to spread to each tick Text element. */
    tickTextProps: { type: Object, default: undefined },
  },
  setup(props, { slots }) {
    const state = reactive({
      fontSize: '',
      letterSpacing: '',
    })
    // const layerRef = ref<HTMLElement | null>(null)

    const getTickLineCoord = (data: CartesianTickItem) => {
      const { x, y, width, height, orientation, tickSize, mirror, tickMargin } = props
      let x1, x2, y1, y2, tx, ty

      const sign = mirror ? -1 : 1
      const finalTickSize = data.tickSize || tickSize
      const tickCoord = isNumber(data.tickCoord) ? data.tickCoord : data.coordinate

      switch (orientation) {
        case 'top':
          x1 = x2 = data.coordinate
          y2 = y + +!mirror * height
          y1 = y2 - sign * finalTickSize
          ty = y1 - sign * tickMargin
          tx = tickCoord
          break
        case 'left':
          y1 = y2 = data.coordinate
          x2 = x + +!mirror * width
          x1 = x2 - sign * finalTickSize
          tx = x1 - sign * tickMargin
          ty = tickCoord
          break
        case 'right':
          y1 = y2 = data.coordinate
          x2 = x + +mirror * width
          x1 = x2 + sign * finalTickSize
          tx = x1 + sign * tickMargin
          ty = tickCoord
          break
        default:
          x1 = x2 = data.coordinate
          y2 = y + +mirror * height
          y1 = y2 + sign * finalTickSize
          ty = y1 + sign * tickMargin
          tx = tickCoord
          break
      }

      return { line: { x1, y1, x2, y2 }, tick: { x: tx, y: ty } }
    }

    const getTickTextAnchor = () => {
      const { orientation, mirror } = props
      let textAnchor

      switch (orientation) {
        case 'left':
          textAnchor = mirror ? 'start' : 'end'
          break
        case 'right':
          textAnchor = mirror ? 'end' : 'start'
          break
        default:
          textAnchor = 'middle'
          break
      }

      return textAnchor
    }

    const getTickVerticalAnchor = () => {
      const { orientation, mirror } = props

      switch (orientation) {
        case 'left':
        case 'right':
          return 'middle'
        case 'top':
          return mirror ? 'start' : 'end'
        default:
          return mirror ? 'end' : 'start'
      }
    }

    const renderAxisLine = () => {
      const { x, y, width, height, orientation, mirror, axisLine } = props
      let lineProps = {
        ...filterProps(props, false),
        ...filterProps(axisLine, false),
        fill: 'none',
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      }

      if (orientation === 'top' || orientation === 'bottom') {
        const needHeight = +((orientation === 'top' && !mirror) || (orientation === 'bottom' && mirror))
        lineProps = {
          ...lineProps,
          x1: x,
          y1: y + needHeight * height,
          x2: x + width,
          y2: y + needHeight * height,
        }
      }
      else {
        const needWidth = +((orientation === 'left' && !mirror) || (orientation === 'right' && mirror))
        lineProps = {
          ...lineProps,
          x1: x + needWidth * width,
          y1: y,
          x2: x + needWidth * width,
          y2: y + height,
        }
      }

      return <line {...lineProps} class={['v-charts-cartesian-axis-line', get(axisLine, 'class')]} />
    }

    function renderTickItem(props: CartesianAxisProps, value: any) {
      const className = ['v-charts-cartesian-axis-tick-value', props.class]
      return (
        <Text
          {...props}
          class={className}
          value={value}
        >
        </Text>
      )
    }

    const renderTicks = (props: any, fontSize: string, letterSpacing: string) => {
      const { tickLine, stroke, tick, tickFormatter, unit } = props
      const finalTicks = getTicks(props as any, fontSize, letterSpacing)
      const textAnchor = getTickTextAnchor()
      const verticalAnchor = getTickVerticalAnchor()
      const axisProps = filterProps(props, false)
      const customTickProps = filterProps(tick, false)
      const tickLineProps = {
        ...axisProps,
        fill: 'none',
        ...filterProps(tickLine, false),
      }
      const items = finalTicks.map((entry: CartesianTickItem, i: number) => {
        const { line: lineCoord, tick: tickCoord } = getTickLineCoord(entry)
        const tickProps = {
          textAnchor,
          verticalAnchor,
          ...axisProps,
          stroke: 'none',
          fill: stroke,
          ...customTickProps,
          ...tickCoord,
          index: i,
          payload: entry,
          visibleTicksCount: finalTicks.length,
          tickFormatter,
          ...props.tickTextProps,
        }
        return (
          <Layer
            class="v-charts-cartesian-axis-tick"
            key={`tick-${entry.value}-${entry.coordinate}-${entry.tickCoord}`}
          >
            {tickLine && (
              <line
                {...tickLineProps}
                {...lineCoord}
                class={['v-charts-cartesian-axis-tick-line', get(tickLine, 'class')]}
              />
            )}
            {tick && (
              slots.tick
                ? slots.tick({ ...tickProps, value: entry.value })
                : renderTickItem(
                    tickProps as any,
                    `${typeof tickFormatter === 'function' ? tickFormatter(entry.value, i) : entry.value}${unit || ''}`,
                  )
            )}
          </Layer>
        )
      })
      return items.length > 0 ? <g class="v-charts-cartesian-axis-ticks">{items}</g> : null
    }
    const renderLabel = () => {
      const { label, x, y, width, height } = props
      if (!label) {
        return null
      }
      const axisViewBox = { x, y, width, height }

      if (typeof label === 'string' || typeof label === 'number') {
        return <Label value={label} viewBox={axisViewBox} />
      }

      if (typeof label === 'object') {
        return <Label {...label} viewBox={axisViewBox} />
      }

      return null
    }

    return () => {
      const { axisLine, width, height, hide } = props

      if (hide) {
        return null
      }
      /*
     * This is different condition from what validateWidthHeight is doing;
     * the CartesianAxis does allow width or height to be undefined.
     */
      if ((width != null && width <= 0) || (height != null && height <= 0)) {
        return null
      }
      return (
        <Layer
          class={['v-charts-cartesian-axis']}
          ref={(ref: ComponentPublicInstance) => {
            const elm = ref?.$el as HTMLElement
            if (elm) {
              const tick: Element | undefined = elm?.getElementsByClassName('v-charts-cartesian-axis-tick-value')[0]
              if (tick) {
                const calculatedFontSize = window.getComputedStyle(tick).fontSize
                const calculatedLetterSpacing = window.getComputedStyle(tick).letterSpacing
                if (calculatedFontSize !== state.fontSize || calculatedLetterSpacing !== state.letterSpacing) {
                  state.fontSize = window.getComputedStyle(tick).fontSize
                  state.letterSpacing = window.getComputedStyle(tick).letterSpacing
                }
              }
            }
          }}
        >
          {axisLine && renderAxisLine()}
          {renderTicks(props, state.fontSize, state.letterSpacing)}
          {renderLabel()}
        </Layer>
      )
    }
  },
},
)
