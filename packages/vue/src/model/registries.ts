import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { AngleAxisSettings, RadiusAxisSettings, XAxisSettings, YAxisSettings, ZAxisSettings } from '@/types/axisSettings'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '@/types/graphical'
import type { ReferenceAreaSettings, ReferenceDotSettings, ReferenceLineSettings } from '@/types/reference'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
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
