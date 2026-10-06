import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { XAxisSettings, YAxisSettings, ZAxisSettings } from '@/state/chartCartesianAxis'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '@/state/chartGraphicalItems'
import type { AngleAxisSettings, RadiusAxisSettings } from '@/state/chartPolarAxis'
import type { ReferenceAreaSettings, ReferenceDotSettings, ReferenceLineSettings } from '@/state/chartReferenceElements'
import type { TooltipPayloadConfiguration } from '@/state/chartTooltip'
import { createRegistry } from './registry'

export function createRegistries() {
  return {
    items: {
      cartesian: createRegistry<CartesianGraphicalItemSettings>(),
      polar: createRegistry<PolarGraphicalItemSettings>(),
    },
    axes: {
      xAxis: createRegistry<XAxisSettings>(),
      yAxis: createRegistry<YAxisSettings>(),
      zAxis: createRegistry<ZAxisSettings>(),
      angleAxis: createRegistry<AngleAxisSettings>(),
      radiusAxis: createRegistry<RadiusAxisSettings>(),
    },
    references: {
      dots: createRegistry<ReferenceDotSettings>(),
      areas: createRegistry<ReferenceAreaSettings>(),
      lines: createRegistry<ReferenceLineSettings>(),
    },
    legendEntries: createRegistry<readonly LegendPayload[]>(),
    tooltipEntries: createRegistry<TooltipPayloadConfiguration>(),
  }
}

export type ChartRegistries = ReturnType<typeof createRegistries>
