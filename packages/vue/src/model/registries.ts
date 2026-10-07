import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { AngleAxisSettings, RadiusAxisSettings, XAxisSettings, YAxisSettings, ZAxisSettings } from '@/types/axisSettings'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '@/types/graphical'
import type { ReferenceAreaSettings, ReferenceDotSettings, ReferenceLineSettings } from '@/types/reference'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { AxisId } from '@/types/axis'
import type { Registry } from './registry'
import { createRegistry } from './registry'
import { axisKey } from '@/core/axis/key'

export interface AxisRegistry<T> extends Registry<T> {
  readonly byId: ComputedRef<ReadonlyMap<string, T>>
}

function createAxisRegistry<T extends { id?: AxisId }>(): AxisRegistry<T> {
  const registry = createRegistry<T>()
  const byId = computed(() => {
    const axes = new Map<string, T>()
    // The last registration wins.
    for (const axis of registry.entries.value)
      axes.set(axisKey(axis.id ?? 0), axis)
    return axes
  })
  return { ...registry, byId }
}

export function createRegistries() {
  return {
    items: {
      cartesian: createRegistry<CartesianGraphicalItemSettings>(),
      polar: createRegistry<PolarGraphicalItemSettings>(),
    },
    axes: {
      xAxis: createAxisRegistry<XAxisSettings>(),
      yAxis: createAxisRegistry<YAxisSettings>(),
      zAxis: createAxisRegistry<ZAxisSettings>(),
      angleAxis: createAxisRegistry<AngleAxisSettings>(),
      radiusAxis: createAxisRegistry<RadiusAxisSettings>(),
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
