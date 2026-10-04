import { provideEntranceGate } from '@/animation/entranceGate'
import { createRechartsStore } from '@/state/store'
import { classProp } from '@/types'
import type { DataKey, LayoutType, Margin, StackOffsetType, SyncMethod, VuePropsToType, WithSVGProps } from '@/types'
import { provideChartContext } from '@/state/chartContext'
import type { PropType, StyleValue } from 'vue'
import { Fragment, defineComponent } from 'vue'
import type { TooltipEventType } from '@/types/tooltip'
import { provideClipPathId } from './provideClipPathId'
import Surface from '@/chart/Surface.vue'
import { ChartDataContextProvider } from '@/context/ChartDataContextProvider'
import type { ChartData } from '@/state/chartData'
import ClipPath from '@/container/ClipPath'
import { ChartsWrapper } from './ChartsWrapper'
import { FULL_WIDTH_AND_HEIGHT } from '@/chart/const'
import { ReportMainChartProps } from '@/state/ReportMainChartProps'
import type { ChartOptions } from '@/state/chartOptions'
import ReportChartProps from '@/state/ReportChartProps'
import { applyDefaultProps } from '@/utils/props'
import { ReportPolarOptions } from '@/state/ReportPolarOptions'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { provideIndependentChart } from '@/context/PanoramaContextProvider'

const defaultLayout: LayoutType = 'horizontal'
const defaultMargin: Margin = { top: 5, right: 5, bottom: 5, left: 5 }

export const CategoricalProps = {
  accessibilityLayer: {
    type: Boolean,
    default: true,
  },
  barCategoryGap: {
    type: [Number, String],
    default: '10%',
  },
  barGap: {
    type: [Number, String],
    default: 4,
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
    default: defaultLayout,
  },
  margin: {
    type: Object as PropType<Margin>,
    default: () => defaultMargin,
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
    default: 'none',
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
    default: 'index',
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
  tooltipPayloadSearcher?: any
}

export function generateCategoricalChart({
  chartName,
  defaultProps = {},
  defaultTooltipEventType = 'axis' as TooltipEventType,
  validateTooltipEventTypes = ['axis' as TooltipEventType],
  tooltipPayloadSearcher,
}: CategoricalChartOptions) {
  return defineComponent<CategoricalChartProps>({
    name: chartName,
    props: applyDefaultProps(CategoricalProps, defaultProps),
    setup(props: CategoricalChartPropsWithOutSvg, { attrs, slots }) {
      const options: ChartOptions = {
        chartName,
        defaultTooltipEventType,
        validateTooltipEventTypes,
        tooltipPayloadSearcher,
        eventEmitter: undefined,
      }
      const store = createRechartsStore(undefined, props.id ?? chartName)
      provideChartContext(store, undefined, options)
      provideEntranceGate()
      provideIndependentChart()

      const clipPathId = provideClipPathId(props)

      const { effectiveWidth, effectiveHeight, hasValidSize, handleResize, isResponsive, measured } = useResponsiveSize(props)

      function renderPolarOptions(isPolarChart: boolean) {
        if (!isPolarChart) {
          return null
        }
        return (
          <ReportPolarOptions
            cx={props.cx ?? '50%'}
            cy={props.cy ?? '50%'}
            startAngle={props.startAngle ?? defaultProps.startAngle ?? 90}
            endAngle={props.endAngle ?? defaultProps.endAngle ?? -270}
            innerRadius={props.innerRadius ?? 0}
            outerRadius={props.outerRadius ?? '80%'}
          />
        )
      }

      return () => {
        const { compact, width, height, title, desc, aspect, initialDimension, ...rest } = props
        const attributes = { ...attrs }

        const layout = props.layout ?? defaultProps.layout ?? defaultLayout
        const isPolarChart = layout === 'centric' || layout === 'radial'

        if (compact) {
          if (!hasValidSize.value) {
            return null
          }
          return (
            <Fragment>
              <ChartDataContextProvider chartData={props.data!} />
              <ReportMainChartProps width={effectiveWidth.value} height={effectiveHeight.value} layout={layout} margin={props.margin} />
              {renderPolarOptions(isPolarChart)}
              <Surface {...attrs} {...rest} width={effectiveWidth.value} height={effectiveHeight.value} title={title} desc={desc}>
                <ClipPath clipPathId={clipPathId} />
                {slots.default?.()}
              </Surface>
            </Fragment>
          )
        }

        if (!isResponsive.value && !hasValidSize.value)
          return null

        if (props.accessibilityLayer) {
          attributes.tabindex = props.tabIndex ?? 0
          attributes.role = props.role ?? 'application'
        }

        // Separate event handler attrs (onMouseDown, etc.) from SVG attrs
        const eventHandlerAttrs: Record<string, any> = {}
        const svgAttributes: Record<string, any> = {}
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
            {hasValidSize.value && <ChartDataContextProvider chartData={props.data!} />}
            {hasValidSize.value && <ReportMainChartProps width={effectiveWidth.value} height={effectiveHeight.value} layout={layout} margin={props.margin ?? defaultMargin} />}
            {hasValidSize.value && renderPolarOptions(isPolarChart)}
            <ChartsWrapper
              isResponsive={isResponsive.value}
              aspect={props.aspect}
              interactive={!isResponsive.value || measured.value}
              onResize={handleResize}
              style={props.style}
              class={props.class}
              width={effectiveWidth.value}
              height={effectiveHeight.value}
              {...eventHandlerAttrs}
            >
              {hasValidSize.value && (
                <Surface
                  {...svgAttributes}
                  width={effectiveWidth.value}
                  height={effectiveHeight.value}
                  title={title}
                  desc={desc}
                  style={FULL_WIDTH_AND_HEIGHT}
                >
                  <ClipPath clipPathId={clipPathId} />
                  {slots.default?.()}
                </Surface>
              )}
              {slots.tooltip?.()}
            </ChartsWrapper>
            {hasValidSize.value && <ReportChartProps {...props as any} />}
          </Fragment>
        )
      }
    },
  })
}
