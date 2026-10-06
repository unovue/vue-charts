import type { EmitFn, InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { BarRectangleItem } from '@/types/bar'
import type { LinePointItem } from '@/cartesian/line/type'
import type { AreaPointItem } from '@/core/area'
import type { ScatterPointItem } from '@/types/common'
import type { PieSectorDataItem } from '@/core/pie'
import type { RadarPoint } from '@/types/radar'
import type { RadialBarDataItem } from '@/types/radialBar'
import type { FunnelTrapezoidItem } from '@/cartesian/funnel/type'

// Views are deferred descendants of the public item; the emitter stays with its owner.
function createItemEvents<Entry, Extra extends Record<string, (...args: never[]) => boolean> = Record<never, never>>(extra: Extra) {
  const itemEvent = (_entry: Entry, _index: number, _event: MouseEvent) => true
  const emits = {
    ...extra,
    'click': itemEvent,
    'mouseenter': itemEvent,
    'mouseleave': itemEvent,
    'animation-start': () => true,
    'animation-end': () => true,
  }
  const key: InjectionKey<EmitFn<typeof emits>> = Symbol('item events')
  return {
    emits,
    provide: (emit: EmitFn<typeof emits>) => provide(key, emit),
    use: () => {
      const emit = inject(key)
      if (!emit)
        throw new Error('Item events require a graphical item owner')
      return emit
    },
  }
}

const modelEvent = { 'update:activeIndex': (_index: number | null) => true }

export const barEvents = createItemEvents<BarRectangleItem, typeof modelEvent>(modelEvent)
export const lineEvents = createItemEvents<LinePointItem>({})
export const areaEvents = createItemEvents<AreaPointItem>({})
export const scatterEvents = createItemEvents<ScatterPointItem>({})
export const pieEvents = createItemEvents<PieSectorDataItem, typeof modelEvent>(modelEvent)
export const radarEvents = createItemEvents<RadarPoint>({})
export const radialBarEvents = createItemEvents<RadialBarDataItem>({})
export const funnelEvents = createItemEvents<FunnelTrapezoidItem>({})
