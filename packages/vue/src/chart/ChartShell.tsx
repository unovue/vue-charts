import type { PropType, VNodeChild } from 'vue'
import { computed, defineComponent } from 'vue'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { createTooltip, provideTooltipController } from '@/model/tooltip'
import { provideChartPresentation } from '@/model/presentation'
import { chartDefaults } from '@/model/defaults'
import { createRegistry } from '@/model/registry'
import type { TooltipPayloadConfiguration } from '@/state/chartTooltip'
import type { ChartOptions } from '@/state/chartOptions'
import { provideRenderPhase } from '@/animation/renderPhase'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'
import { ChartWrapper } from './ChartWrapper'
import { useItemInteractions } from '@/events/useItemInteractions'
import Surface from '@/container/Surface'
import { boxAttrs, rootAttrs } from './CellGridLayer'

/** Size and selection live in the root scope; descendants share only these capabilities. */
export function useChartShell(
  props: Parameters<typeof useResponsiveSize>[0],
  options: ChartOptions,
) {
  provideRenderPhase()
  const size = useResponsiveSize(props)
  const dimensions = computed(() => ({
    width: size.effectiveWidth.value,
    height: size.effectiveHeight.value,
  }))
  // Preserve standalone layout hooks and tooltip positioning from the original viewport.
  const width = computed(() => 0)
  const height = computed(() => 0)
  const margin = computed(() => chartDefaults.margin)
  const offset = computed(() => ({
    top: margin.value.top ?? 0,
    left: margin.value.left ?? 0,
    bottom: margin.value.bottom ?? 0,
    right: margin.value.right ?? 0,
    brushBottom: margin.value.bottom ?? 0,
    width: width.value,
    height: height.value,
  }))
  const viewBox = computed(() => ({
    x: offset.value.left,
    y: offset.value.top,
    width: offset.value.width,
    height: offset.value.height,
  }))
  const tooltip = createTooltip({
    entries: createRegistry<TooltipPayloadConfiguration>(),
    data: computed(() => ({ chartData: undefined, dataStartIndex: 0, dataEndIndex: 0 })),
    options: () => options,
    layout: () => 'horizontal',
    size: () => dimensions.value,
    offset: () => offset.value,
  })
  provideTooltipController(tooltip)
  provideChartPresentation({
    name: computed(() => options.chartName),
    layout: computed(() => 'horizontal'),
    width,
    height,
    margin,
    viewBox,
    offset,
    accessibility: computed(() => true),
    bandSize: computed(() => undefined),
    syncId: computed(() => undefined),
    emitter: computed(() => undefined),
  })
  return size
}

interface ChartContent {
  svg: () => VNodeChild
  before?: () => VNodeChild
}

const shellSurfaceProps = {
  size: { type: Object as PropType<ReturnType<typeof useChartShell>>, required: true as const },
  root: { type: String as PropType<'wrapper' | 'surface'>, default: 'surface' },
  title: String,
  desc: String,
  overflow: { type: String, default: undefined },
  setupContent: Function as PropType<() => ChartContent>,
}

// Geometry follows the surface's scope, including disposal when a chart becomes empty.
// Root event callbacks stay in the setup closure; this component forwards no events.
const ShellContent = defineComponent({
  name: 'ShellContent',
  inheritAttrs: false,
  props: shellSurfaceProps,
  setup(props, { attrs, slots }) {
    const content = props.setupContent?.()
    return () => (
      <>
        {content?.before?.() ?? slots.before?.()}
        <Surface
          {...props.root === 'surface' ? rootAttrs(attrs) : {}}
          title={props.title}
          desc={props.desc}
          width={props.size.effectiveWidth.value}
          height={props.size.effectiveHeight.value}
          style={{ width: '100%', height: '100%', overflow: props.overflow }}
        >
          {content ? content.svg() : slots.svg?.()}
        </Surface>
      </>
    )
  },
})

export const ChartShell = defineComponent({
  name: 'ChartShell',
  inheritAttrs: false,
  props: { ...shellSurfaceProps, accessibilityLayer: Boolean },
  emits: chartEmits,
  setup(props, { attrs, slots, emit }) {
    const interactions = useItemInteractions()
    return () => {
      const size = props.size
      return (
        <ChartWrapper
          {...props.root === 'wrapper' ? rootAttrs(attrs) : {}}
          {...boxAttrs(attrs)}
          {...chartListeners(emit)}
          accessibilityLayer={props.accessibilityLayer}
          title={props.title}
          desc={props.desc}
          isResponsive={size.isResponsive.value}
          boxStyle={size.boxStyle.value}
          interactive={!size.isResponsive.value || size.measured.value}
          onResize={size.handleResize}
          width={size.effectiveWidth.value}
          height={size.effectiveHeight.value}
          interactions={interactions}
        >
          <ShellContent
            {...attrs}
            size={size}
            root={props.root}
            title={props.title}
            desc={props.desc}
            overflow={props.overflow}
            setupContent={props.setupContent}
          >
            {{ svg: slots.svg, before: slots.before }}
          </ShellContent>
          {slots.default?.()}
        </ChartWrapper>
      )
    }
  },
})
