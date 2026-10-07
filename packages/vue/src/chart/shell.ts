import type { StyleValue } from 'vue'
import { get } from 'es-toolkit/compat'
import type { ChartOptions } from '@/model/options'
import { defaultChartCapabilities } from '@/model/options'
import type { TooltipPayloadSearcher } from '@/types/tooltip'
import type { VueClassValue } from '@/types/common'

/** Hierarchies address tooltip items by path, e.g. `children[0].children[1]` or `links[2]`. */
const pathPayloadSearcher: TooltipPayloadSearcher = (data, payloadKey) =>
  data && payloadKey ? get(data, payloadKey) : undefined

/** Chart options shared by every standalone chart: tooltips belong to a single item. */
export function standaloneChartOptions(chartName: string): ChartOptions {
  return {
    chartName,
    capabilities: defaultChartCapabilities,
    defaultTooltipEventType: 'item',
    validateTooltipEventTypes: ['item'],
    tooltipPayloadSearcher: pathPayloadSearcher,
    eventEmitter: undefined,
  }
}

/** Caller `class` and `style` for the chart box. Attributes are untyped, so they are narrowed here once. */
export function boxAttrs(attrs: Record<string, unknown>): { class?: VueClassValue, style?: StyleValue } {
  return { class: attrs.class as VueClassValue, style: attrs.style as StyleValue }
}

/** Caller attributes for the SVG root: `class` and `style` go to the chart box instead. */
export function rootAttrs(attrs: Record<string, unknown>) {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
}
