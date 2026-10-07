import type { TooltipEventType } from '@/types/tooltip'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideClipPathId, provideRenderPhase } from '@/model/runtime'
import type { ExtractPropTypes, SetupContext } from 'vue'
import { Fragment } from 'vue'
import ChartSurface from '@/chart/ChartSurface.vue'
import ClipPath from '@/container/ClipPath'
import { ChartsWrapper } from './ChartsWrapper'
import { FULL_WIDTH_AND_HEIGHT } from '@/chart/const'
import { createChart, provideChart } from '@/model/chart'
import { chartDefaults } from '@/model/defaults'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useChartId } from '@/hooks/useChartId'
import { commonChartProps, polarChartProps } from './chartProps'
import type { radialChartProps } from './chartProps'
import { provideChartAnimation } from '@/model/animation'

type CategoricalChartPropsWithOutSvg = ExtractPropTypes<typeof commonChartProps>
  & Partial<ExtractPropTypes<typeof radialChartProps>>

export interface CategoricalChartOptions {
  chartName: string
  defaultTooltipEventType?: TooltipEventType
  validateTooltipEventTypes?: readonly TooltipEventType[]
}

function createChartSetup({
  chartName,
  defaultTooltipEventType = 'axis',
  validateTooltipEventTypes = ['axis'],
}: CategoricalChartOptions) {
  const defaultTitle = chartName === 'ComposedChart'
    ? 'Chart'
    : chartName.replace(/Chart$/, ' chart').replace('RadialBar', 'Radial bar')
  return function setup(props: CategoricalChartPropsWithOutSvg, { attrs, slots, emit }: SetupContext<typeof chartEmits>) {
    provideChartAnimation(props)
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
            barCategoryGap: props.barCategoryGap ?? chartDefaults.barCategoryGap,
            barGap: props.barGap ?? chartDefaults.barGap,
            barSize: props.barSize,
            class: props.class,
            maxBarSize: props.maxBarSize,
            reverseStackOrder: props.reverseStackOrder,
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
      tooltip: () => ({ chartName, defaultTooltipEventType, validateTooltipEventTypes }),
    })
    provideChart(chart)
    provideRenderPhase()

    const clipPathId = provideClipPathId(props)
    const descriptionId = useChartId('v-charts-desc')

    return () => {
      const { compact, title, desc } = props
      const attributes = { ...attrs }

      if (compact) {
        if (!hasValidSize.value) {
          return null
        }
        return (
          <Fragment>
            <ChartSurface {...attrs} class={props.class} style={props.style} {...{ role: props.accessibilityLayer ? undefined : props.role ?? 'img' }} width={effectiveWidth.value} height={effectiveHeight.value} title={title} desc={desc}>
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
            role={props.role}
            title={title ?? defaultTitle}
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
                  'role': props.accessibilityLayer ? undefined : props.role ?? 'img',
                  'aria-label': props.accessibilityLayer ? undefined : title ?? defaultTitle,
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
  }
}

/**
 * The component options shared by every chart root. Spread into `defineComponent` next to the
 * chart's prop set, and call `root.setup` from the chart's own `setup`:
 * `defineComponent({ ...root, props: cartesianChartProps, setup: (props, context) => root.setup(props, context) })`.
 * The wrapper keeps the public props type equal to the chart's prop set; passing the shared
 * setup directly would let its parameter type add the props of every chart family.
 */
export function chartRoot(options: CategoricalChartOptions) {
  return { name: options.chartName, inheritAttrs: false, emits: chartEmits, setup: createChartSetup(options) }
}

/** Polar chart props with the chart's own layout and angle defaults. */
export function polarProps(defaults: Pick<CategoricalChartPropsWithOutSvg, 'layout' | 'startAngle' | 'endAngle'>) {
  return {
    ...commonChartProps,
    ...polarChartProps,
    layout: { ...commonChartProps.layout, default: defaults.layout },
    startAngle: { ...polarChartProps.startAngle, default: defaults.startAngle },
    endAngle: { ...polarChartProps.endAngle, default: defaults.endAngle },
  }
}
