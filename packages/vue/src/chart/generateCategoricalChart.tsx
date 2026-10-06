import type { TooltipEventType, TooltipPayloadSearcher } from '@/types/tooltip'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideClipPathId, provideRenderPhase } from '@/model/runtime'
import { classProp } from '@/types'
import type { DataKey, LayoutType, Margin, StackOffsetType, SyncMethod, VuePropsToType, WithSVGProps } from '@/types'
import type { PropType, StyleValue } from 'vue'
import { Fragment, defineComponent } from 'vue'
import ChartSurface from '@/chart/ChartSurface.vue'
import type { ChartData } from '@/types/chartData'
import ClipPath from '@/container/ClipPath'
import { ChartsWrapper } from './ChartsWrapper'
import { FULL_WIDTH_AND_HEIGHT } from '@/chart/const'
import { createChart, provideChart } from '@/model/chart'
import { chartDefaults } from '@/model/defaults'
import { applyDefaultProps } from '@/utils/props'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useChartId } from '@/hooks/useChartId'

export const CategoricalProps = {
  accessibilityLayer: {
    type: Boolean,
    default: chartDefaults.accessibilityLayer,
  },
  barCategoryGap: {
    type: [Number, String],
    default: chartDefaults.barCategoryGap,
  },
  barGap: {
    type: [Number, String],
    default: chartDefaults.barGap,
  },
  barSize: {
    type: [Number, String],
  },
  class: classProp,
  compact: {
    type: Boolean,
  },
  cx: {
    type: [Number, String],
  },
  cy: {
    type: [Number, String],
  },
  data: {
    type: Array as PropType<ChartData>,
    default: () => [],
  },
  dataKey: {
    type: [String, Number, Function] as PropType<DataKey<any>>,
  },
  desc: {
    type: String,
  },
  endAngle: {
    type: Number,
  },
  id: {
    type: String,
  },
  innerRadius: {
    type: [Number, String],
  },
  layout: {
    type: String as PropType<LayoutType>,
    default: chartDefaults.layout,
  },
  margin: {
    type: Object as PropType<Margin>,
    default: () => ({ ...chartDefaults.margin }),
  },
  maxBarSize: {
    type: Number,
  },
  outerRadius: {
    type: [Number, String],
  },
  ...chartSizeProps,
  reverseStackOrder: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
  },
  stackOffset: {
    type: String as PropType<StackOffsetType>,
    default: chartDefaults.stackOffset,
  },
  startAngle: {
    type: Number,
  },
  style: {
    type: [String, Object, Array] as PropType<StyleValue>,
  },
  syncId: {
    type: [Number, String],
  },
  syncMethod: {
    type: [String, Function] as PropType<SyncMethod>,
    default: chartDefaults.syncMethod,
  },
  tabIndex: {
    type: Number,
  },
  throttleDelay: {
    type: Number,
  },
  title: {
    type: String,
  },
  to: {
    type: [String, Object] as PropType<string | HTMLElement | null>,
  },
}

export type CategoricalChartPropsWithOutSvg = VuePropsToType<typeof CategoricalProps>

export type CategoricalChartProps = WithSVGProps<CategoricalChartPropsWithOutSvg>

export interface CategoricalChartOptions {
  chartName: string
  defaultProps?: Partial<CategoricalChartPropsWithOutSvg>
  defaultTooltipEventType?: TooltipEventType
  validateTooltipEventTypes?: readonly TooltipEventType[]
  tooltipPayloadSearcher?: TooltipPayloadSearcher
}

export function generateCategoricalChart({
  chartName,
  defaultProps = {},
  defaultTooltipEventType = 'axis' as TooltipEventType,
  validateTooltipEventTypes = ['axis' as TooltipEventType],
  tooltipPayloadSearcher,
}: CategoricalChartOptions) {
  return defineComponent({
    name: chartName,
    props: applyDefaultProps(CategoricalProps, defaultProps),
    inheritAttrs: false,
    emits: chartEmits,
    setup(props, { attrs, slots, emit }) {
      const {
        effectiveWidth,
        effectiveHeight,
        hasValidSize,
        handleResize,
        isResponsive,
        measured,
        boxStyle,
      } = useResponsiveSize(props)
      const chart = createChart({
        data: () => hasValidSize.value ? props.data : undefined,
        layout: () => props.layout,
        size: () => ({ width: effectiveWidth.value, height: effectiveHeight.value }),
        margin: () => props.margin,
        // Compact panoramas used root defaults instead of reported wrapper options.
        options: () => props.compact
          ? chartDefaults
          : ({
              accessibilityLayer: props.accessibilityLayer,
              barCategoryGap: props.barCategoryGap,
              barGap: props.barGap,
              barSize: props.barSize,
              class: props.class,
              maxBarSize: props.maxBarSize,
              stackOffset: props.stackOffset,
              syncId: props.syncId,
              syncMethod: props.syncMethod,
            }),
        polar: () => props.layout === 'centric' || props.layout === 'radial'
          ? {
              cx: props.cx ?? chartDefaults.cx,
              cy: props.cy ?? chartDefaults.cy,
              startAngle: props.startAngle ?? chartDefaults.startAngle,
              endAngle: props.endAngle ?? chartDefaults.endAngle,
              innerRadius: props.innerRadius ?? chartDefaults.innerRadius,
              outerRadius: props.outerRadius ?? chartDefaults.outerRadius,
            }
          : null,
        tooltip: () => ({ chartName, defaultTooltipEventType, validateTooltipEventTypes, tooltipPayloadSearcher }),
      })
      provideChart(chart)
      provideRenderPhase()

      const clipPathId = provideClipPathId(props)
      const descriptionId = useChartId('v-charts-desc')

      return () => {
        const { compact, width, height, title, desc, aspect, initialDimension, ...rest } = props
        const attributes = { ...attrs }

        if (compact) {
          if (!hasValidSize.value) {
            return null
          }
          return (
            <Fragment>
              <ChartSurface {...attrs} {...rest} {...{ role: props.accessibilityLayer ? undefined : 'img' }} width={effectiveWidth.value} height={effectiveHeight.value} title={title} desc={desc}>
                <ClipPath clipPathId={clipPathId} />
                {slots.default?.()}
              </ChartSurface>
            </Fragment>
          )
        }

        if (!isResponsive.value && !hasValidSize.value)
          return null

        if (props.accessibilityLayer) {
          delete attributes.tabindex
          delete attributes.role
        }

        // Separate event handler attrs (onMouseDown, etc.) from SVG attrs
        const eventHandlerAttrs: Record<string, unknown> = {}
        const svgAttributes: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(attributes)) {
          if (key.startsWith('on') && typeof value === 'function') {
            eventHandlerAttrs[key] = value
          }
          else {
            svgAttributes[key] = value
          }
        }
        return (
          <Fragment>
            <ChartsWrapper
              accessibilityLayer={props.accessibilityLayer}
              tabIndex={props.tabIndex}
              title={title ?? `${chartName} chart`}
              descriptionId={desc ? descriptionId : undefined}
              isResponsive={isResponsive.value}
              boxStyle={boxStyle.value}
              interactive={!isResponsive.value || measured.value}
              onResize={handleResize}
              style={props.style}
              class={props.class}
              width={effectiveWidth.value}
              height={effectiveHeight.value}
              {...eventHandlerAttrs}
              {...chartListeners(emit)}
            >
              {hasValidSize.value && (
                <ChartSurface
                  {...{
                    ...svgAttributes,
                    'role': props.accessibilityLayer ? undefined : 'img',
                    'aria-label': props.accessibilityLayer ? undefined : title ?? `${chartName} chart`,
                    'aria-describedby': desc ? descriptionId : undefined,
                  }}
                  descriptionId={descriptionId}
                  width={effectiveWidth.value}
                  height={effectiveHeight.value}
                  title={title}
                  desc={desc}
                  style={FULL_WIDTH_AND_HEIGHT}
                >
                  <ClipPath clipPathId={clipPathId} />
                  {slots.default?.()}
                </ChartSurface>
              )}
              {slots.tooltip?.()}
            </ChartsWrapper>
          </Fragment>
        )
      }
    },
  })
}
