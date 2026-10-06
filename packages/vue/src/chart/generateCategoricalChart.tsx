import type { TooltipEventType, TooltipPayloadSearcher } from '@/types/tooltip'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideClipPathId, provideRenderPhase } from '@/model/runtime'
import type { ExtractPropTypes, SetupContext } from 'vue'
import { Fragment, defineComponent } from 'vue'
import ChartSurface from '@/chart/ChartSurface.vue'
import ClipPath from '@/container/ClipPath'
import { ChartsWrapper } from './ChartsWrapper'
import { FULL_WIDTH_AND_HEIGHT } from '@/chart/const'
import { createChart, provideChart } from '@/model/chart'
import { chartDefaults } from '@/model/defaults'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useChartId } from '@/hooks/useChartId'
import { cartesianChartProps, commonChartProps, funnelChartProps, polarChartProps, radialChartProps } from './chartProps'
import { provideChartAnimation } from '@/model/animation'

type CategoricalChartPropsWithOutSvg = ExtractPropTypes<typeof commonChartProps>
  & Partial<ExtractPropTypes<typeof radialChartProps>>

export interface CategoricalChartOptions {
  chartName: string
  defaultProps?: Partial<Pick<CategoricalChartPropsWithOutSvg, 'layout' | 'startAngle' | 'endAngle'>>
  defaultTooltipEventType?: TooltipEventType
  validateTooltipEventTypes?: readonly TooltipEventType[]
  tooltipPayloadSearcher?: TooltipPayloadSearcher
}

function createChartSetup({
  chartName,
  defaultTooltipEventType = 'axis',
  validateTooltipEventTypes = ['axis'],
  tooltipPayloadSearcher,
}: CategoricalChartOptions) {
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
  }
}

function componentOptions(options: CategoricalChartOptions) {
  return { name: options.chartName, inheritAttrs: false, emits: chartEmits }
}

export function generateCartesianChart(options: CategoricalChartOptions) {
  const setupChart = createChartSetup(options)
  return defineComponent({
    ...componentOptions(options),
    props: cartesianChartProps,
    setup(props, context) {
      return setupChart(props, context)
    },
  })
}

function polarProps(options: CategoricalChartOptions) {
  return {
    ...commonChartProps,
    ...polarChartProps,
    layout: { ...commonChartProps.layout, default: options.defaultProps?.layout ?? 'centric' },
    startAngle: { ...polarChartProps.startAngle, default: options.defaultProps?.startAngle },
    endAngle: { ...polarChartProps.endAngle, default: options.defaultProps?.endAngle },
  }
}

export function generatePolarChart(options: CategoricalChartOptions) {
  const setupChart = createChartSetup(options)
  return defineComponent({
    ...componentOptions(options),
    props: polarProps(options),
    setup(props, context) {
      return setupChart(props, context)
    },
  })
}

export function generateRadialChart(options: CategoricalChartOptions) {
  const setupChart = createChartSetup(options)
  return defineComponent({
    ...componentOptions(options),
    props: { ...radialChartProps, ...polarProps(options) },
    setup(props, context) {
      return setupChart(props, context)
    },
  })
}

export function generateFunnelChart(options: CategoricalChartOptions) {
  const setupChart = createChartSetup(options)
  return defineComponent({
    ...componentOptions(options),
    props: funnelChartProps,
    setup(props, context) {
      return setupChart(props, context)
    },
  })
}
