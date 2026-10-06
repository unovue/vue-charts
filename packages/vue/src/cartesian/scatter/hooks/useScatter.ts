import { computed } from 'vue'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { useAppSelector } from '@/state/hooks'
import { selectScatterPoints } from '@/state/selectors/scatterSelectors'
import type { ResolvedScatterSettings } from '@/state/selectors/scatterSelectors'
import type { DataKey } from '@/types'

export interface ScatterProps {
  xAxisId?: string | number
  yAxisId?: string | number
  zAxisId?: string | number
  dataKey?: DataKey<any>
  data?: ReadonlyArray<unknown>
  name?: string | number
  hide?: boolean
  fill?: string
  stroke?: string
  isAnimationActive?: boolean
  tooltipType?: string
}

export function useScatter(props: ScatterProps) {
  const isPanorama = useIsPanorama()

  const scatterSettings = computed<ResolvedScatterSettings>(() => ({
    data: props.data as any,
    dataKey: props.dataKey,
    tooltipType: props.tooltipType as any,
    name: props.name ?? String(props.dataKey ?? ''),
  }))

  const points = useAppSelector(state =>
    selectScatterPoints(
      state,
      props.xAxisId ?? 0,
      props.yAxisId ?? 0,
      props.zAxisId ?? 0,
      scatterSettings.value,
      isPanorama,
    ),
  )

  const shouldRender = computed(() => {
    return !props.hide && points.value != null && points.value.length > 0
  })

  return {
    shouldRender,
    points,
  }
}
